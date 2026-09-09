/**
 * DevvProxy High-Performance Edge Rate Limiting Engine
 *
 * Algorithm: In-Memory Sliding Window Counter
 * Time Complexity: O(K) where K is number of requests in current 60s window (typically < 300)
 * Latency Overhead: < 0.05ms in Node.js runtime
 * Zero external Redis dependency required for Layer 1 edge deployments.
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  retryAfterSeconds?: number;
}

// In-memory sliding window store: Identifier -> Array of epoch timestamps (ms)
const windowStore = new Map<string, number[]>();

// Window duration in milliseconds (1 minute)
const WINDOW_DURATION_MS = 60_000;

// Periodic cleanup interval to prevent memory leaks from inactive identifiers
const CLEANUP_INTERVAL_MS = 120_000;
let lastCleanup = Date.now();

function cleanupStaleWindows(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const threshold = now - WINDOW_DURATION_MS;
  for (const [id, timestamps] of windowStore.entries()) {
    const active = timestamps.filter((t) => t > threshold);
    if (active.length === 0) {
      windowStore.delete(id);
    } else {
      windowStore.set(id, active);
    }
  }
}

/**
 * Checks and increments rate limit for a specific identifier
 *
 * @param identifier Unique rate limit key (e.g., 'key:devv_live_...' or 'ip:192.168.1.1')
 * @param limitRpm Allowed requests per minute (RPM)
 */
export function checkRateLimit(
  identifier: string,
  limitRpm: number = 60
): RateLimitResult {
  const now = Date.now();
  cleanupStaleWindows(now);

  const windowStart = now - WINDOW_DURATION_MS;
  const existingTimestamps = windowStore.get(identifier) || [];

  // Filter out timestamps outside the active 60-second sliding window
  const activeTimestamps = existingTimestamps.filter((t) => t > windowStart);

  if (activeTimestamps.length >= limitRpm) {
    // Limit exceeded
    const oldestTimestamp = activeTimestamps[0] || now;
    const retryAfterMs = oldestTimestamp + WINDOW_DURATION_MS - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

    windowStore.set(identifier, activeTimestamps);

    return {
      allowed: false,
      limit: limitRpm,
      remaining: 0,
      resetSeconds: retryAfterSeconds,
      retryAfterSeconds,
    };
  }

  // Record current request timestamp
  activeTimestamps.push(now);
  windowStore.set(identifier, activeTimestamps);

  const oldestTimestamp = activeTimestamps[0];
  const resetMs = oldestTimestamp + WINDOW_DURATION_MS - now;
  const resetSeconds = Math.max(1, Math.ceil(resetMs / 1000));
  const remaining = Math.max(0, limitRpm - activeTimestamps.length);

  return {
    allowed: true,
    limit: limitRpm,
    remaining,
    resetSeconds,
  };
}

/**
 * Generates standard RFC and OpenAI-compatible rate limit response headers
 */
export function getRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit-Requests': result.limit.toString(),
    'X-RateLimit-Remaining-Requests': result.remaining.toString(),
    'X-RateLimit-Reset-Requests': result.resetSeconds.toString(),
  };

  if (!result.allowed && result.retryAfterSeconds) {
    headers['Retry-After'] = result.retryAfterSeconds.toString();
  }

  return headers;
}

/**
 * Generates an OpenAI-compatible HTTP 429 JSON error body
 */
export function formatRateLimitError(result: RateLimitResult): {
  error: {
    message: string;
    type: string;
    param: null;
    code: string;
  };
} {
  return {
    error: {
      message: `Rate limit exceeded: You have sent too many requests. Your quota is ${result.limit} requests per minute. Please retry after ${result.retryAfterSeconds}s.`,
      type: 'requests',
      param: null,
      code: 'rate_limit_exceeded',
    },
  };
}

/**
 * Clears all rate limiting windows (used for demo resets and test suites)
 */
export function clearRateLimits(): void {
  windowStore.clear();
}
