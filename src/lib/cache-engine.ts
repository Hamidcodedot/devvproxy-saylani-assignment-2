import crypto from 'crypto';
import { ChatMessage, ChatCompletionResponse, CacheEntry } from '@/types';

// In-Memory Hot Cache Store (L1 cache for sub-millisecond lookups)
const hotCache = new Map<string, CacheEntry>();
const MAX_HOT_CACHE_ITEMS = 500;

/**
 * Deterministically sorts object keys recursively for canonical JSON serialization
 */
function canonicalize(value: any): any {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  const sortedKeys = Object.keys(value).sort();
  const result: Record<string, any> = {};
  for (const key of sortedKeys) {
    result[key] = canonicalize(value[key]);
  }
  return result;
}

export interface CacheKeyParams {
  keyId: string;
  model: string;
  rawMessages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  response_format?: any;
  tools?: any[];
  tool_choice?: any;
  stop?: string | string[];
  seed?: number;
}

/**
 * Computes a deterministic SHA-256 hash for a request payload
 * Scoped by keyId, canonical messages, and schema parameters to ensure zero collisions
 */
export function generateCacheKey(params: CacheKeyParams): string {
  const normalized = {
    keyId: params.keyId,
    model: params.model.toLowerCase().trim(),
    messages: params.rawMessages.map((m) => ({
      role: m.role,
      content:
        typeof m.content === 'string'
          ? m.content.trim().normalize('NFC')
          : canonicalize(m.content),
      name: m.name || undefined,
    })),
    temperature: params.temperature ?? 1.0,
    top_p: params.top_p ?? 1.0,
    max_tokens: params.max_tokens ?? null,
    response_format: params.response_format ? canonicalize(params.response_format) : null,
    tools: params.tools ? canonicalize(params.tools) : null,
    tool_choice: params.tool_choice ? canonicalize(params.tool_choice) : null,
    stop: params.stop || null,
    seed: params.seed ?? null,
  };

  const canonicalString = JSON.stringify(canonicalize(normalized));
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

/**
 * Checks in-memory hot cache first, then calls optional fallback
 * Implements LRU order refresh
 */
export function getHotCacheEntry(cacheHash: string): CacheEntry | null {
  const entry = hotCache.get(cacheHash);
  if (!entry) return null;

  // Check expiration
  if (new Date(entry.expires_at).getTime() < Date.now()) {
    hotCache.delete(cacheHash);
    return null;
  }

  // Refresh LRU order
  hotCache.delete(cacheHash);
  entry.hit_count += 1;
  entry.last_accessed_at = new Date().toISOString();
  hotCache.set(cacheHash, entry);
  return entry;
}

/**
 * Stores response in the hot cache
 */
export function setHotCacheEntry(
  cacheHash: string,
  keyId: string,
  model: string,
  response: ChatCompletionResponse,
  tokensSaved: number
): CacheEntry {
  // Evict oldest if full
  if (hotCache.size >= MAX_HOT_CACHE_ITEMS) {
    const oldestKey = hotCache.keys().next().value;
    if (oldestKey) hotCache.delete(oldestKey);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

  const entry: CacheEntry = {
    cache_hash: cacheHash,
    key_id: keyId,
    model,
    response_body: response,
    tokens_saved: tokensSaved,
    hit_count: 1,
    created_at: now.toISOString(),
    last_accessed_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  hotCache.set(cacheHash, entry);
  return entry;
}

/**
 * Estimate cost saved based on total tokens and model tier
 */
export function calculateCostSavings(tokens: number, model: string): number {
  // Standard pricing approximations per 1,000 tokens
  // gpt-4o-mini: ~$0.00015 input, ~$0.0006 output => avg $0.00035 / 1k tokens
  // gpt-4o: ~$0.005 / 1k tokens
  const lower = model.toLowerCase();
  let ratePer1k = 0.00035;
  if (lower.includes('gpt-4o') && !lower.includes('mini')) {
    ratePer1k = 0.005;
  } else if (lower.includes('llama') || lower.includes('mixtral')) {
    ratePer1k = 0.0002;
  }
  return Number(((tokens / 1000) * ratePer1k).toFixed(6));
}

/**
 * Resets/clears the in-memory hot cache
 */
export function clearHotCache(): void {
  hotCache.clear();
}

