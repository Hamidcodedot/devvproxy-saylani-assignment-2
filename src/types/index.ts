export type PiiType = 'EMAIL' | 'CREDIT_CARD' | 'SSN' | 'PHONE' | 'SECRET_KEY';

export type CachePolicyType = 'static' | 'dynamic' | 'volatile' | 'client_override';

export interface CachePolicyDecision {
  action: 'CACHE' | 'BYPASS';
  policyType: CachePolicyType;
  ttlSeconds: number;
  reason?: string;
}

export interface PiiRedactionResult {
  sanitizedText: string;
  count: number;
  detectedTypes: PiiType[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool' | 'developer';
  content: string | any[];
  name?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  user?: string;
  simulate_outage?: boolean; // Demo flag
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: ChatCompletionUsage;
  _devv?: {
    cache_hit: boolean;
    cache_policy?: CachePolicyType;
    cache_bypass_reason?: string;
    provider: 'cache' | 'openai' | 'groq' | 'simulator';
    pii_scrubbed_count: number;
    pii_types: PiiType[];
    latency_ms: number;
    cost_saved_usd: number;
  };
}

export interface ApiKeyRecord {
  id: string;
  name: string;
  key_hash: string;
  prefix: string;
  rate_limit_rpm: number;
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
}

export interface CacheEntry {
  cache_hash: string;
  key_id: string;
  model: string;
  response_body: ChatCompletionResponse;
  tokens_saved: number;
  hit_count: number;
  policy_type?: CachePolicyType;
  ttl_seconds?: number;
  created_at: string;
  last_accessed_at: string;
  expires_at: string;
}

export interface RequestLog {
  id: string;
  key_id: string;
  model: string;
  upstream_provider: 'cache' | 'openai' | 'groq' | 'simulator';
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  cache_hit: boolean;
  pii_scrubbed_count: number;
  pii_types_detected: PiiType[];
  estimated_cost_usd: number;
  cost_saved_usd: number;
  status_code: number;
  created_at: string;
}

export interface DashboardStats {
  totalRequests: number;
  totalTokensProcessed: number;
  tokensSavedViaCache: number;
  dollarsSavedTotal: number;
  piiEntitiesRedacted: number;
  cacheHitRatePct: number;
  avgCacheLatencyMs: number;
  avgUpstreamLatencyMs: number;
  systemStatus: 'operational' | 'degraded' | 'maintenance';
}
