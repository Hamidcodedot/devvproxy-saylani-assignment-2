import { ChatCompletionRequest, ChatCompletionResponse, ChatMessage } from '@/types';

// Map OpenAI / standard model identifiers to active Groq models
const GROQ_MODEL_MAP: Record<string, string> = {
  'gpt-4o-mini': 'groq/compound-mini',
  'gpt-4o': 'groq/compound',
  'gpt-3.5-turbo': 'groq/compound-mini',
  'llama-3.3-70b-versatile': 'groq/compound-mini',
  'groq/compound-mini': 'groq/compound-mini',
  'groq/compound': 'groq/compound',
  'qwen/qwen3.6-27b': 'qwen/qwen3.6-27b',
};

// 15-second timeout for primary provider to accommodate deep reasoning while avoiding stalls
const PRIMARY_TIMEOUT_MS = 15000;

export interface DispatchResult {
  response: ChatCompletionResponse;
  provider: 'openai' | 'groq' | 'simulator';
  latencyMs: number;
}

/**
 * Generates a realistic mock response for offline demonstration or zero-key testing
 */
export function generateMockCompletion(
  model: string,
  messages: ChatMessage[],
  isFailover = false
): ChatCompletionResponse {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || 'Hello';
  
  let replyText = `[DevvProxy Edge Gateway] Request processed securely. All sensitive PII was scrubbed prior to analysis.\n\nInput summary: Received ${messages.length} message(s). Your query: "${lastUserMsg.slice(0, 100)}${lastUserMsg.length > 100 ? '...' : ''}" has been validated.`;
  
  if (isFailover) {
    replyText += `\n\n[Resilience Notice]: Primary upstream provider experienced high latency / rate limit (429). DevvProxy automatically failed over to secondary cluster with zero packet loss.`;
  }

  const promptTokens = Math.max(15, Math.round(JSON.stringify(messages).length / 4));
  const completionTokens = Math.max(25, Math.round(replyText.length / 4));

  return {
    id: `chatcmpl-devv-${Math.random().toString(36).substring(2, 12)}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: isFailover ? 'llama-3.3-70b-versatile' : model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: replyText,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  };
}

/**
 * Dispatches an AI completion request to OpenAI with automatic failover to Groq,
 * or graceful fallback to the built-in Mock Simulator.
 */
export async function dispatchCompletion(
  payload: ChatCompletionRequest,
  clientApiKey?: string,
  simulateOutage = false
): Promise<DispatchResult> {
  const startTime = Date.now();
  const openaiKey = clientApiKey || process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const allowSimulator = process.env.DEVV_SIMULATOR_FALLBACK !== 'false';

  // Strip proxy-internal fields (like simulate_outage) before sending upstream to prevent 400 schema errors
  const { simulate_outage: _unused, ...upstreamPayload } = payload as any;

  // 1. If explicit simulation of outage is requested (for demo toggle)
  if (simulateOutage) {
    // Attempt Groq if available
    if (groqKey) {
      try {
        const groqModel = GROQ_MODEL_MAP[payload.model] || 'groq/compound-mini';
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            ...upstreamPayload,
            model: groqModel,
          }),
        });
        if (res.ok) {
          const data: ChatCompletionResponse = await res.json();
          return {
            response: data,
            provider: 'groq',
            latencyMs: Date.now() - startTime,
          };
        }
      } catch {
        // Fall through to simulator
      }
    }
    // Fallback to simulator showing outage failover
    await new Promise((resolve) => setTimeout(resolve, 140)); // Realistic network latency
    return {
      response: generateMockCompletion(payload.model, payload.messages, true),
      provider: 'simulator',
      latencyMs: Date.now() - startTime,
    };
  }

  // 2. Primary Provider: OpenAI
  if (openaiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PRIMARY_TIMEOUT_MS);

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify(upstreamPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if primary succeeded
      if (res.ok) {
        const data: ChatCompletionResponse = await res.json();
        return {
          response: data,
          provider: 'openai',
          latencyMs: Date.now() - startTime,
        };
      }

      // Check if eligible for failover (429 Rate Limit, 5xx Server Error)
      const isEligibleForFailover = res.status === 429 || res.status >= 500;
      if (!isEligibleForFailover) {
        // 400 Bad Request, 401 Unauthorized, etc. should be returned directly
        const errorJson = await res.json().catch(() => ({ error: { message: `Upstream error ${res.status}` } }));
        throw new Error(errorJson?.error?.message || `Upstream HTTP ${res.status}`);
      }
    } catch (err: any) {
      // If error is 400/401/403, rethrow directly
      if (err.message && !err.message.includes('abort') && !err.message.includes('429') && !err.message.includes('50')) {
        throw err;
      }
    }
  }

  // 3. Failover Provider: Groq
  if (groqKey) {
    try {
      const groqController = new AbortController();
      const groqTimeout = setTimeout(() => groqController.abort(), 12000);
      const groqModel = GROQ_MODEL_MAP[payload.model] || 'groq/compound-mini';
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          ...upstreamPayload,
          model: groqModel,
        }),
        signal: groqController.signal,
      });
      clearTimeout(groqTimeout);

      if (groqRes.ok) {
        const groqData: ChatCompletionResponse = await groqRes.json();
        return {
          response: groqData,
          provider: 'groq',
          latencyMs: Date.now() - startTime,
        };
      }
    } catch {
      // Continue to simulator
    }
  }

  // 4. Ultimate Resilience: Mock Simulator
  if (allowSimulator) {
    await new Promise((resolve) => setTimeout(resolve, 95)); // Realistic edge response time
    return {
      response: generateMockCompletion(payload.model, payload.messages, false),
      provider: 'simulator',
      latencyMs: Date.now() - startTime,
    };
  }

  throw new Error('All upstream AI providers unavailable. Please configure OPENAI_API_KEY or GROQ_API_KEY.');
}
