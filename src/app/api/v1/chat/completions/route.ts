import { NextRequest, NextResponse, after } from 'next/server';
import { authenticateApiKey, recordRequestLog } from '@/lib/supabase';
import { scrubMessages } from '@/lib/pii-engine';
import {
  generateCacheKey,
  getHotCacheEntry,
  setHotCacheEntry,
  calculateCostSavings,
} from '@/lib/cache-engine';
import { dispatchCompletion } from '@/lib/proxy-router';
import { ChatCompletionRequest, ChatCompletionResponse } from '@/types';
import {
  checkRateLimit,
  getRateLimitHeaders,
  formatRateLimitError,
} from '@/lib/rate-limiter';

// Enforce Node.js runtime for full crypto compatibility & long timeouts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate Bearer Key
    const authHeader = req.headers.get('authorization') || '';
    const keyRecord = await authenticateApiKey(authHeader);

    if (!keyRecord) {
      return NextResponse.json(
        {
          error: {
            message:
              'Invalid or missing DevvProxy API Key. Use Authorization: Bearer devv_live_... or check your dashboard.',
            type: 'authentication_error',
            code: 'invalid_api_key',
          },
        },
        { status: 401 }
      );
    }

    // 2. Edge Rate Limiter (Sliding Window RPM Enforcement)
    const rateLimit = checkRateLimit(
      `key:${keyRecord.id}`,
      keyRecord.rate_limit_rpm || 60
    );

    if (!rateLimit.allowed) {
      const errorBody = formatRateLimitError(rateLimit);
      const rlHeaders = getRateLimitHeaders(rateLimit);
      return NextResponse.json(errorBody, {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...rlHeaders,
        },
      });
    }

    const rateLimitHeaders = getRateLimitHeaders(rateLimit);

    // 2. Parse & Validate Incoming Request Body
    const body: ChatCompletionRequest = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request body: "messages" array is required.',
            type: 'invalid_request_error',
          },
        },
        { status: 400 }
      );
    }

    // Gracefully handle unsupported streaming in 48-hour MVP
    if (body.stream) {
      return NextResponse.json(
        {
          error: {
            message:
              'DevvProxy v1.0 currently enforces privacy & caching over standard non-streaming completions. Streaming is scheduled for v1.1.',
            type: 'invalid_request_error',
          },
        },
        { status: 400 }
      );
    }

    const model = body.model || 'gpt-4o-mini';
    const temperature = body.temperature ?? 1.0;
    const top_p = body.top_p ?? 1.0;
    const max_tokens = body.max_tokens;

    // Optional Bring-Your-Own-Key passed ephemerally via header
    const ephemeralUpstreamKey = req.headers.get('x-devv-upstream-key') || undefined;

    // 3. PII Redaction Pipeline (Edge Sanitization)
    const { sanitizedMessages, totalPiiCount, detectedTypes } = scrubMessages(body.messages);

    // 4. Deterministic Cache Lookup
    const cacheKey = generateCacheKey({
      keyId: keyRecord.id,
      model,
      rawMessages: body.messages, // Tenant + Raw prompt identity ensures zero placeholder collisions
      temperature,
      top_p,
      max_tokens,
      response_format: (body as any).response_format,
      tools: (body as any).tools,
      tool_choice: (body as any).tool_choice,
      stop: (body as any).stop,
      seed: (body as any).seed,
    });

    const cachedEntry = getHotCacheEntry(cacheKey);

    // ============================================================================
    // CASE A: CACHE HIT (< 20ms, $0.00 cost, 100% token savings)
    // ============================================================================
    if (cachedEntry) {
      const latencyMs = Date.now() - startTime;
      const tokensSaved = cachedEntry.tokens_saved || 0;
      const costSaved = calculateCostSavings(tokensSaved, model);

      const cachedResponse: ChatCompletionResponse = {
        ...cachedEntry.response_body,
        _devv: {
          cache_hit: true,
          provider: 'cache',
          pii_scrubbed_count: totalPiiCount,
          pii_types: detectedTypes,
          latency_ms: latencyMs,
          cost_saved_usd: costSaved,
        },
      };

      // Non-blocking telemetry logging via Next.js 15 after()
      after(async () => {
        await recordRequestLog({
          key_id: keyRecord.id,
          model,
          upstream_provider: 'cache',
          prompt_tokens: cachedResponse.usage?.prompt_tokens || 0,
          completion_tokens: cachedResponse.usage?.completion_tokens || 0,
          total_tokens: tokensSaved,
          latency_ms: latencyMs,
          cache_hit: true,
          pii_scrubbed_count: totalPiiCount,
          pii_types_detected: detectedTypes,
          estimated_cost_usd: 0,
          cost_saved_usd: costSaved,
          status_code: 200,
        });
      });

      return NextResponse.json(cachedResponse, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Devv-Cache': 'HIT',
          'X-Devv-Provider': 'cache',
          'X-Devv-Latency-Saved-Ms': `${Math.max(0, 420 - latencyMs)}`,
          'X-Devv-PII-Scrubbed': `${totalPiiCount}`,
          ...rateLimitHeaders,
        },
      });
    }

    // ============================================================================
    // CASE B: CACHE MISS (Dispatch sanitized payload to Upstream Provider with Failover)
    // ============================================================================
    const sanitizedPayload: ChatCompletionRequest = {
      ...body,
      model,
      messages: sanitizedMessages,
    };

    const dispatchResult = await dispatchCompletion(
      sanitizedPayload,
      ephemeralUpstreamKey,
      body.simulate_outage
    );

    const latencyMs = dispatchResult.latencyMs;
    const totalTokens = dispatchResult.response.usage?.total_tokens || 0;
    const estimatedCost = calculateCostSavings(totalTokens, model);

    // Populate L1 Hot Cache
    setHotCacheEntry(cacheKey, keyRecord.id, model, dispatchResult.response, totalTokens);

    const enrichedResponse: ChatCompletionResponse = {
      ...dispatchResult.response,
      _devv: {
        cache_hit: false,
        provider: dispatchResult.provider,
        pii_scrubbed_count: totalPiiCount,
        pii_types: detectedTypes,
        latency_ms: latencyMs,
        cost_saved_usd: 0,
      },
    };

    // Non-blocking telemetry logging via Next.js 15 after()
    after(async () => {
      await recordRequestLog({
        key_id: keyRecord.id,
        model,
        upstream_provider: dispatchResult.provider,
        prompt_tokens: dispatchResult.response.usage?.prompt_tokens || 0,
        completion_tokens: dispatchResult.response.usage?.completion_tokens || 0,
        total_tokens: totalTokens,
        latency_ms: latencyMs,
        cache_hit: false,
        pii_scrubbed_count: totalPiiCount,
        pii_types_detected: detectedTypes,
        estimated_cost_usd: estimatedCost,
        cost_saved_usd: 0,
        status_code: 200,
      });
    });

    return NextResponse.json(enrichedResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Devv-Cache': 'MISS',
        'X-Devv-Provider': dispatchResult.provider,
        'X-Devv-PII-Scrubbed': `${totalPiiCount}`,
        ...rateLimitHeaders,
      },
    });
  } catch (error: any) {
    console.error('DevvProxy Route Error:', error);
    return NextResponse.json(
      {
        error: {
          message: error.message || 'DevvProxy Internal Error',
          type: 'api_error',
        },
      },
      { status: 500 }
    );
  }
}
