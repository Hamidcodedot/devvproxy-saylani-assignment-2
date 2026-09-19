import type { ChatMessage, CachePolicyDecision } from '../types/index.ts';

// ============================================================================
// PRE-COMPILED VOLATILITY HEURISTIC REGEX PATTERNS (Linear & ReDoS-Safe)
// ============================================================================

// Financial, crypto, and market tickers
const FINANCIAL_VOLATILE_REGEX =
  /\b(bitcoin|btc|ethereum|eth|solana|sol|doge|crypto|cryptocurrency|stocks?|shares?|market\s*cap|all-time\s*high|ath|exchange\s*rate|forex|pkr|usd|eur|gbp)\b/i;

const PRICE_INQUIRY_REGEX =
  /\b(price\s+of|how\s+much\s+(is|does)\s+(a\s+|an\s+|1\s+)?[a-z0-9]+|current\s+(value|rate|cost)\s+of|worth\s+of)\b/i;

// Real-time temporal indicators
const TEMPORAL_VOLATILE_REGEX =
  /\b(today|tonight|yesterday|tomorrow|right\s+now|at\s+the\s+moment|currently?|latest|breaking\s+news|live\s+updates?|as\s+of\s+now|up-?to-?date|real-?time)\b/i;

// Live weather, sports, and current event indicators
const LIVE_EVENTS_REGEX =
  /\b(weather\s+in|forecast\s+(for|in)|temperature\s+in|raining\s+in|live\s+scores?|who\s+won(\s+the|\s+yesterday)?|election\s+results?)\b/i;

// Default Static TTL: 30 Days in seconds
export const DEFAULT_STATIC_TTL_SECONDS = 30 * 24 * 60 * 60; // 2,592,000s

/**
 * Extracts combined searchable prompt text from incoming messages
 * Focuses on user and developer prompts where live queries originate
 */
export function extractQueryText(messages: ChatMessage[]): string {
  if (!Array.isArray(messages) || messages.length === 0) return '';
  return messages
    .filter((m) => m.role === 'user' || m.role === 'developer')
    .map((m) => {
      if (typeof m.content === 'string') return m.content;
      if (Array.isArray(m.content)) {
        return m.content
          .map((part) => (typeof part === 'string' ? part : part?.text || ''))
          .join(' ');
      }
      return '';
    })
    .join(' ');
}

/**
 * Checks if a text prompt exhibits volatile real-time characteristics
 * Returns the detection reason or null if invariant
 */
export function detectVolatility(text: string): string | null {
  if (!text || text.length === 0) return null;

  // 1. Check direct price inquiry ("price of bitcoin", "how much is eth")
  if (PRICE_INQUIRY_REGEX.test(text)) {
    return 'price_inquiry_detected';
  }

  // 2. Check crypto/financial volatility paired with temporal markers or standalone
  if (FINANCIAL_VOLATILE_REGEX.test(text)) {
    if (TEMPORAL_VOLATILE_REGEX.test(text) || /\b(price|value|rate|cap|trend)\b/i.test(text)) {
      return 'financial_ticker_volatile';
    }
  }

  // 3. Check explicit temporal real-time requests ("today's news", "weather right now")
  if (TEMPORAL_VOLATILE_REGEX.test(text)) {
    return 'temporal_marker_detected';
  }

  // 4. Check environmental or live score queries
  if (LIVE_EVENTS_REGEX.test(text)) {
    return 'live_event_query_detected';
  }

  return null;
}

/**
 * Evaluates the cache policy for an incoming request based on:
 * 1. Explicit Client HTTP Headers (X-Devv-Cache-Control, Cache-Control, X-Devv-Cache-TTL)
 * 2. Edge Volatility Heuristics (< 0.05ms linear scan)
 * 3. Default Invariant Static Policy (30-day TTL)
 */
export function evaluateCachePolicy(
  messages: ChatMessage[],
  headers?: Headers | Record<string, string | null | undefined>
): CachePolicyDecision {
  // Helper to read header case-insensitively
  const getHeader = (name: string): string | null => {
    if (!headers) return null;
    if (typeof (headers as Headers).get === 'function') {
      return (headers as Headers).get(name);
    }
    const record = headers as Record<string, string | null | undefined>;
    const lowerName = name.toLowerCase();
    for (const key of Object.keys(record)) {
      if (key.toLowerCase() === lowerName) {
        return record[key] ?? null;
      }
    }
    return null;
  };

  // 1. Check explicit client cache-control directives
  const devvCacheControl = getHeader('x-devv-cache-control') || getHeader('cache-control');
  if (devvCacheControl) {
    const lower = devvCacheControl.toLowerCase().trim();
    if (lower.includes('no-cache') || lower.includes('no-store')) {
      return {
        action: 'BYPASS',
        policyType: 'client_override',
        ttlSeconds: 0,
        reason: 'client_no_cache',
      };
    }
    const maxAgeMatch = lower.match(/max-age=(\d+)/);
    if (maxAgeMatch) {
      const maxAge = parseInt(maxAgeMatch[1], 10);
      if (maxAge === 0) {
        return {
          action: 'BYPASS',
          policyType: 'client_override',
          ttlSeconds: 0,
          reason: 'client_max_age_zero',
        };
      }
      return {
        action: 'CACHE',
        policyType: 'client_override',
        ttlSeconds: maxAge,
        reason: 'client_max_age',
      };
    }
  }

  // 2. Check explicit custom TTL header (X-Devv-Cache-TTL)
  const customTtlHeader = getHeader('x-devv-cache-ttl');
  if (customTtlHeader) {
    const parsedTtl = parseInt(customTtlHeader, 10);
    if (!isNaN(parsedTtl)) {
      if (parsedTtl <= 0) {
        return {
          action: 'BYPASS',
          policyType: 'client_override',
          ttlSeconds: 0,
          reason: 'client_zero_ttl',
        };
      }
      return {
        action: 'CACHE',
        policyType: 'client_override',
        ttlSeconds: parsedTtl,
        reason: 'client_custom_ttl',
      };
    }
  }

  // 3. Scan messages for real-time temporal and financial volatility
  const queryText = extractQueryText(messages);
  const volatileReason = detectVolatility(queryText);

  if (volatileReason) {
    return {
      action: 'BYPASS',
      policyType: 'volatile',
      ttlSeconds: 0,
      reason: volatileReason,
    };
  }

  // 4. Default invariant static knowledge query (Safe to cache for 30 days)
  return {
    action: 'CACHE',
    policyType: 'static',
    ttlSeconds: DEFAULT_STATIC_TTL_SECONDS,
    reason: 'invariant_static_knowledge',
  };
}
