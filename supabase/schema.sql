-- ==============================================================================
-- DevvProxy: Supabase PostgreSQL Database Schema (Multi-Tenant & Modular)
-- Architecture: Clean, Standalone, Reusable Auth & Subscription Schema
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Users Table (Modular, Standalone Auth)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'developer',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ------------------------------------------------------------------------------
-- 2. Subscriptions Table (Provider-Agnostic Billing)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'hobby', -- 'hobby' | 'pro' | 'enterprise'
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'canceled' | 'past_due'
    provider TEXT NOT NULL DEFAULT 'manual', -- 'stripe' | 'safepay' | 'manual'
    customer_id TEXT,
    subscription_id TEXT,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- ------------------------------------------------------------------------------
-- 3. Virtual API Keys Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,
    prefix TEXT NOT NULL,
    rate_limit_rpm INT DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

-- ------------------------------------------------------------------------------
-- 4. Deterministic Response Cache Store
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cache_entries (
    cache_hash TEXT PRIMARY KEY,
    key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    response_body JSONB NOT NULL,
    tokens_saved INT DEFAULT 0,
    hit_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days'
);

CREATE INDEX IF NOT EXISTS idx_cache_entries_key_id ON cache_entries(key_id);
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires ON cache_entries(expires_at);

-- ------------------------------------------------------------------------------
-- 5. Observability & Security Audit Log
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    upstream_provider TEXT NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    latency_ms INT NOT NULL,
    cache_hit BOOLEAN DEFAULT FALSE,
    pii_scrubbed_count INT DEFAULT 0,
    pii_types_detected TEXT[] DEFAULT ARRAY[]::TEXT[],
    estimated_cost_usd NUMERIC(10, 6) DEFAULT 0.000000,
    cost_saved_usd NUMERIC(10, 6) DEFAULT 0.000000,
    status_code INT DEFAULT 200,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_logs_created ON request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_key_id ON request_logs(key_id);

-- ------------------------------------------------------------------------------
-- 6. Initial Seed: Default Demo User & Key
-- ------------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, name, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@devvproxy.com',
    'f6c07044431e67041530e7ab21e3f8fe43916964177d6ee47ea6d1230e9dcf5c', -- sha256('demo123')
    'Demo Evaluator',
    'developer'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO subscriptions (id, user_id, plan, status, provider)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'pro',
    'active',
    'manual'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO api_keys (id, user_id, name, key_hash, prefix, rate_limit_rpm, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Production Default Key',
    '310e30907e5b3ee5895bbdce3dbbb577e9238384fa6e8971fbe96f131a2386a3', -- sha256('devv_live_demo_9481b37c')
    'devv_live_demo',
    120,
    TRUE
) ON CONFLICT (key_hash) DO NOTHING;
