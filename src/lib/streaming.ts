import type { ChatCompletionResponse, ChatMessage } from '@/types';

/**
 * DevvProxy Chunked Server-Sent Events (SSE) Streaming Engine
 *
 * Implements wire-compatible OpenAI streaming (text/event-stream) for:
 * 1. Fast 0ms synthetic streaming from L1 Hot Cache
 * 2. Mock simulator streaming for offline / test workloads
 * 3. Zero-buffering pass-through TransformStream with background cache assembly
 */

export const SSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no', // Instructs CDNs/gateways not to buffer chunks
};

/**
 * Formats a single OpenAI-compatible chat completion chunk payload
 */
export function formatSseChunk(
  id: string,
  model: string,
  deltaContent: string,
  finishReason: string | null = null,
  role?: string
): string {
  const payload: any = {
    id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        delta: role ? { role, content: deltaContent } : { content: deltaContent },
        finish_reason: finishReason,
      },
    ],
  };

  return `data: ${JSON.stringify(payload)}\n\n`;
}

/**
 * Synthesizes an immediate (<3ms TTFT) SSE stream from a cached completion entry
 */
export function createCachedStream(
  cachedResponse: ChatCompletionResponse,
  model: string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const id = cachedResponse.id || `chatcmpl-cached-${Math.random().toString(36).substring(2, 9)}`;
  const rawContent = cachedResponse.choices[0]?.message?.content;
  const fullContent =
    typeof rawContent === 'string'
      ? rawContent
      : Array.isArray(rawContent)
        ? rawContent.map((c: any) => (typeof c === 'string' ? c : c?.text || '')).join('')
        : '';

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      // Chunk 1: Role initialization + first segment
      controller.enqueue(
        encoder.encode(formatSseChunk(id, model, '', null, 'assistant'))
      );

      // Split content into small, natural token clusters (3-5 words) for smooth client hydration
      const words = fullContent.split(' ');
      const chunkSize = 4;

      for (let i = 0; i < words.length; i += chunkSize) {
        const slice = words.slice(i, i + chunkSize).join(' ');
        const chunkText = i + chunkSize < words.length ? `${slice} ` : slice;
        controller.enqueue(encoder.encode(formatSseChunk(id, model, chunkText, null)));
      }

      // Final stop chunk
      controller.enqueue(encoder.encode(formatSseChunk(id, model, '', 'stop')));
      // Stream terminal token
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

/**
 * Creates a mock simulator SSE stream with realistic chunk cadence
 */
export function createMockSimulatorStream(
  model: string,
  messages: ChatMessage[],
  isFailover = false
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const rawUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content;
  const lastUserMsg =
    typeof rawUserMsg === 'string'
      ? rawUserMsg
      : Array.isArray(rawUserMsg)
        ? rawUserMsg.map((c: any) => (typeof c === 'string' ? c : c?.text || '')).join('')
        : 'Hello';

  let replyText = `[DevvProxy Edge Gateway] Request processed securely. All sensitive PII was scrubbed prior to analysis.\n\nInput summary: Received ${messages.length} message(s). Your query: "${lastUserMsg.slice(0, 100)}${lastUserMsg.length > 100 ? '...' : ''}" has been validated.`;

  if (isFailover) {
    replyText += `\n\n[Resilience Notice]: Primary upstream provider experienced high latency / rate limit (429). DevvProxy automatically failed over to secondary cluster with zero packet loss.`;
  }

  const id = `chatcmpl-mock-${Math.random().toString(36).substring(2, 9)}`;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      // Role initialization
      controller.enqueue(
        encoder.encode(formatSseChunk(id, model, '', null, 'assistant'))
      );

      // Stream words smoothly
      const words = replyText.split(' ');
      const chunkSize = 3;

      for (let i = 0; i < words.length; i += chunkSize) {
        const slice = words.slice(i, i + chunkSize).join(' ');
        const chunkText = i + chunkSize < words.length ? `${slice} ` : slice;
        controller.enqueue(encoder.encode(formatSseChunk(id, model, chunkText, null)));
        // Subtle micro-tick for realistic streaming cadence
        await new Promise((resolve) => setTimeout(resolve, 8));
      }

      // Stop chunk
      controller.enqueue(encoder.encode(formatSseChunk(id, model, '', 'stop')));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

/**
 * Creates a zero-latency pass-through TransformStream that forwards upstream
 * SSE bytes to the client immediately while asynchronously parsing chunks
 * in the background to assemble the full response text for L1 cache population.
 */
export function createPassThroughCollectorStream(
  sourceStream: ReadableStream<Uint8Array>,
  onComplete: (assembledText: string, totalTokens: number) => void | Promise<void>
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let accumulatedText = '';
  let lineBuffer = '';

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      // 1. Forward raw chunk to client with ZERO delay (maintaining <5ms TTFT)
      controller.enqueue(chunk);

      // 2. Decode chunk text in background
      const text = decoder.decode(chunk, { stream: true });
      lineBuffer += text;

      // Extract complete SSE lines
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() || ''; // Keep incomplete trailing fragment in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          const deltaContent = parsed.choices?.[0]?.delta?.content;
          if (typeof deltaContent === 'string') {
            accumulatedText += deltaContent;
          }
        } catch {
          // Ignore JSON parse errors on malformed vendor chunks
        }
      }
    },
    async flush() {
      // Process any remaining bytes in lineBuffer
      if (lineBuffer.trim().startsWith('data:')) {
        const dataStr = lineBuffer.trim().slice(5).trim();
        if (dataStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(dataStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (typeof deltaContent === 'string') {
              accumulatedText += deltaContent;
            }
          } catch {
            // Ignore
          }
        }
      }

      // Calculate approximate token metrics
      const estimatedTokens = Math.max(1, Math.round(accumulatedText.length / 4));
      try {
        await onComplete(accumulatedText, estimatedTokens);
      } catch (err) {
        console.error('Error in background stream completion callback:', err);
      }
    },
  });

  return sourceStream.pipeThrough(transformStream);
}
