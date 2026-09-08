# DevvProxy — Privacy-First AI Gateway & Cost Firewall

<div align="center">

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**A high-performance, drop-in AI Gateway compatible with the OpenAI API specification.**  
Enforces **edge PII redaction**, provides **0ms deterministic caching** (100% token savings), guarantees **resilient multi-provider failover**, and records live audit telemetry into **Supabase PostgreSQL**.

[Live Demo](https://devvproxy-saylani-assignment-2.vercel.app) • [GitHub Repository](https://github.com/Hamidcodedot/devvproxy-saylani-assignment-2) • [Documentation](https://devvproxy-saylani-assignment-2.vercel.app/docs) • [Part of devvkit.com](https://devvkit.com)

</div>

---

## 📋 Table of Contents

- [Executive Summary](#-executive-summary)
- [Course Assignment Overview](#-course-assignment-overview)
- [Evaluator Quickstart (1-Click Grading)](#-evaluator-quickstart-1-click-grading)
- [Core Architectural Capabilities](#-core-architectural-capabilities)
- [System Architecture & Request Lifecycle](#-system-architecture--request-lifecycle)
- [1-Line Drop-In Integration](#-1-line-drop-in-integration)
- [Security & Privacy Posture](#-security--privacy-posture)
- [Database Schema & RLS Security](#-database-schema--rls-security)
- [Project Directory Structure](#-project-directory-structure)
- [Local Setup & Development Guide](#-local-setup--development-guide)
- [Automated Verification & Test Suite](#-automated-verification--test-suite)
- [Product Roadmap & Phased Delivery](#-product-roadmap--phased-delivery)
- [Author & License](#-author--license)

---

## 📌 Executive Summary

Modern engineering teams want to leverage LLMs (OpenAI, Anthropic, Meta Llama) but face critical production barriers:
1. **Data Privacy & Compliance Risks:** Accidentally leaking customer credit cards, SSNs, API tokens, or internal emails into third-party training pipelines.
2. **Exponential Inference Costs:** Paying full token rates repeatedly for identical user prompts.
3. **Upstream Vulnerability:** Relying on single-provider uptime where rate limits (HTTP 429) or outages crash production applications.

**DevvProxy** solves these challenges as a **Layer 1 Edge Gateway**. Sitting between your applications and LLM providers, it sanitizes sensitive data in-flight, returns instant cached responses for repetitive queries at zero cost, and seamlessly routes around provider outages.

---

## 🎓 Course Assignment Overview

- **Course:** Saylani Web & AI Modern Application Engineering
- **Assignment:** Assignment 2 — Full-Stack Production AI System
- **Repository:** [`Hamidcodedot/devvproxy-saylani-assignment-2`](https://github.com/Hamidcodedot/devvproxy-saylani-assignment-2)
- **Live Deployment:** [Vercel Production](https://devvproxy-saylani-assignment-2.vercel.app)
- **Database:** Supabase Cloud Managed PostgreSQL (`vhtjcndakzfpumwovbpz.supabase.co`)
- **Key Deliverables Completed:**
  - Full-Stack Next.js 15 App Router application with zero external runtime UI dependencies.
  - Custom Edge PII Sanitizer with mathematical Luhn algorithm checksum validation.
  - Deterministic L1 Cache with canonical SHA-256 request fingerprinting.
  - Multi-Provider Router with OpenAI primary, Groq high-speed fallback, and an offline mock simulator.
  - Supabase PostgreSQL persistence with Row-Level Security (RLS) policies.
  - Command Center with real-time audit logs, interactive security sandbox, and 1-click demo reset.
  - Transparent Product Roadmap and Phase 2 monetization disclosures.

---

## ⚡ Evaluator Quickstart (1-Click Grading)

For instructor and peer evaluations, DevvProxy includes a dedicated **Evaluator Mode** that requires zero manual setup:

1. Visit the live deployment: **[https://devvproxy-saylani-assignment-2.vercel.app/login](https://devvproxy-saylani-assignment-2.vercel.app/login)**
2. Click the **"One-Click Demo Access"** button (or enter `demo@devvkit.com` / `demo123456`).
3. You will be instantly authenticated into the **Command Center**:
   - **Side-by-Side Sandbox:** Click any sample payload (*Credit Card & Email*, *SSN & Phone*, or *Leaked API Key*) and click **"Send via DevvProxy"**.
   - **Observe PII Stripping:** The raw payload shows the credit card, while the edge-sanitized upstream payload shows `[REDACTED_CREDIT_CARD]`.
   - **Test 0ms Cache:** Send the exact same query again. Notice the latency drop to **< 5ms** and provider switch to **`cache`**.
   - **Test Upstream Failover:** Check *"Simulate Upstream 429 Outage"* and observe automatic rerouting to Groq/Llama-3.3.
   - **Reset Demo Data:** Click the **`Reset Demo`** button in the header to flush the cache and reset metrics to a clean zero state.

---

## 🌟 Core Architectural Capabilities

### 1. ReDoS-Resistant Edge PII Firewall
All payload scanning is executed in linear time ($O(N)$) using non-backtracking regular expressions:
- **Credit Cards:** Validates 13–19 digit cards mathematically using the **Luhn Algorithm Checksum** (detects Visa, Mastercard, Amex, Discover) while ignoring false positives.
- **Email Addresses:** RFC 5322 compliant linear pattern stripping user emails into `[REDACTED_EMAIL]`.
- **US Social Security Numbers:** Validates delimiter formats `\d{3}-\d{2}-\d{4}` into `[REDACTED_SSN]`.
- **Phone Numbers:** International E.164 and US phone variations into `[REDACTED_PHONE]`.
- **API Keys & Secrets:** Detects leaked `sk-live_...`, `ghp_...`, AWS Access Keys, and Bearer tokens into `[REDACTED_API_KEY]`.
- **Deep Multimodal & Developer Role Support:** Recursively sanitizes nested array content parts and supports standard `system`, `user`, `assistant`, and `developer` message roles.

### 2. Deterministic SHA-256 L1 Cache (100% Token Savings)
- **Canonical Serialization:** Keys are sorted deterministically before hashing. `{ "role": "user", "content": "hi" }` and `{ "content": "hi", "role": "user" }` generate the exact same fingerprint.
- **Scope Isolation:** Cache entries are keyed by `tenant_id:model:fingerprint`, preventing cross-organization cache collisions.
- **Performance:** Cache hits resolve in **< 5ms** with **0 tokens consumed** and **$0.00 upstream cost**.

### 3. Multi-Provider Resilience & Auto-Failover
```
Client Request
      │
      ▼
┌──────────────┐   HTTP 429 / 5xx / Timeout   ┌──────────────┐   Offline / Missing Key   ┌──────────────┐
│ Primary LLM  │ ───────────────────────────> │ Fallback LLM │ ────────────────────────> │ Mock Gateway │
│ OpenAI GPT-4 │                              │ Groq Llama-3 │                           │ Simulator    │
└──────────────┘                              └──────────────┘                           └──────────────┘
```
- **Primary:** OpenAI (`gpt-4o-mini`, `gpt-4o`).
- **High-Speed Fallback:** Groq Cloud (`llama-3.3-70b-versatile`) with 10-second bounded timeout controllers.
- **Client Error Boundaries:** Upstream client errors (HTTP 400 invalid parameters, HTTP 401 invalid user keys) are preserved and returned to the client rather than masked as failover events.
- **Offline Mock Simulator:** Guarantees presentations and evaluator tests continue functioning even during internet connectivity issues or third-party outages.

### 4. Live Command Center & Telemetry
- **Zero-State Precision:** Metrics start at genuine zero states with no artificial or inflated baselines.
- **Dynamic Scale Formatting:** Automatically scales token counts (`0`, `1.7k`, `1.50M`) and computes dynamic latency reduction.
- **Real-Time Audit Trail:** Displays model, latency, scrubbed PII count, token usage, and cost savings for every transaction.
- **1-Click Demo Reset & Traffic Generator:** Reset the entire environment back to 0 or seed sample traffic with single button clicks.

---

## 🏗️ System Architecture & Request Lifecycle

```
[ Client Application (Python / Node.js / cURL / Sandbox) ]
                           │
                           │ POST /api/v1/chat/completions (Bearer devv_live_...)
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DevvProxy Edge Engine                              │
│                                                                         │
│  [Phase 1: Authentication & Key Verification]                           │
│  - Hashes incoming bearer token with SHA-256                            │
│  - O(1) in-memory key vault lookup with Supabase fallback                │
│                                                                         │
│  [Phase 2: In-Flight PII Firewall]                                      │
│  - Linear scanning of messages array (text & multimodal blocks)         │
│  - Mathematical Luhn checksum verification for credit cards             │
│  - Replaces sensitive tokens with uniform redaction placeholders        │
│                                                                         │
│  [Phase 3: Deterministic SHA-256 L1 Cache Engine]                       │
│  - Generates canonical JSON key (tenant + model + messages + params)    │
│  - If Cache HIT ──> Return 0ms Cached Response ($0.00, 100% saved)      │
│                                                                         │
│  [Phase 4: Resilient Upstream Router]                                   │
│  - Primary Provider: OpenAI (gpt-4o-mini)                               │
│  - Automatic Failover: Groq Cloud (llama-3.3-70b-versatile)              │
│  - Emergency Fallback: Offline Mock Simulator                           │
│                                                                         │
│  [Phase 5: Non-Blocking Telemetry Dispatcher]                           │
│  - Asynchronous background logging via Next.js 15 `after()`             │
│  - Persists audit record to Supabase PostgreSQL `request_logs`          │
└─────────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
       [ Supabase Cloud Managed PostgreSQL Database ]
```

---

## 💻 1-Line Drop-In Integration

DevvProxy is 100% wire-compatible with the official OpenAI API specification.

### Python (OpenAI SDK)

```python
from openai import OpenAI

# Simply redirect base_url to your DevvProxy endpoint
client = OpenAI(
    base_url="https://devvproxy-saylani-assignment-2.vercel.app/api/v1",
    api_key="devv_live_demo_9481b37c"
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "Process refund for john@corp.com with card 4532-0150-1823-9984"}
    ]
)

print(response.choices[0].message.content)
```

### Node.js / TypeScript (OpenAI SDK)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://devvproxy-saylani-assignment-2.vercel.app/api/v1',
  apiKey: 'devv_live_demo_9481b37c',
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: 'Customer inquiry from sarah@fintech.io regarding card 4532-1188-9922-3344' }
    ],
  });

  console.log(completion.choices[0].message.content);
}

main();
```

### Raw cURL

```bash
curl https://devvproxy-saylani-assignment-2.vercel.app/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer devv_live_demo_9481b37c" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Hello! My email is dev@company.org and phone is +1-555-019-2834"}
    ]
  }'
```

### Custom Response Headers

DevvProxy returns telemetry directly in HTTP headers for immediate inspection:
- `X-Devv-Cache: HIT | MISS`
- `X-Devv-Provider: cache | openai | groq | mock`
- `X-Devv-PII-Scrubbed: <integer>` (count of scrubbed sensitive entities)
- `X-Devv-Cost-Saved: <usd>` (dollars saved via cache hit)

---

## 🔒 Security & Privacy Posture

DevvProxy was built following OWASP Top 10 API Security recommendations:

| Category | Implementation Standard |
| :--- | :--- |
| **Key Storage** | Virtual API keys are hashed with **SHA-256** (`crypto.createHash('sha256')`). Plaintext keys are never stored in the database. |
| **Authentication** | Passwords hashed using **PBKDF2** (10,000 iterations, 512-bit salt). Sessions signed with HMAC-SHA256 in **HTTP-Only, Secure, SameSite=Lax** cookies. |
| **Database Security** | **Row-Level Security (RLS)** enabled across all tables. Client queries use service role boundaries in server routes. |
| **ReDoS Prevention** | Input strings are strictly bounded, and all regex patterns are non-backtracking linear automata. |
| **Data Privacy** | In-memory telemetry scrubbing ensures sensitive PII is masked *before* writing to PostgreSQL audit logs. |

---

## 🗄️ Database Schema & RLS Security

The database runs on Supabase PostgreSQL with the following relational schema:

```sql
-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Subscriptions Table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL DEFAULT 'free_hobby',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Virtual API Keys Table (Hashed)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT UNIQUE NOT NULL,
  prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  rate_limit_rpm INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Audit & Telemetry Request Logs Table
CREATE TABLE request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  upstream_provider TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  latency_ms INTEGER NOT NULL,
  cache_hit BOOLEAN DEFAULT FALSE,
  pii_scrubbed_count INTEGER DEFAULT 0,
  pii_types_detected TEXT[] DEFAULT ARRAY[]::TEXT[],
  estimated_cost_usd NUMERIC(10, 6) DEFAULT 0,
  cost_saved_usd NUMERIC(10, 6) DEFAULT 0,
  status_code INTEGER DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row-Level Security Enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;
```

---

## 📁 Project Directory Structure

```
saylani-assignment2/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analytics/route.ts        # Telemetry aggregation, demo reset & seed
│   │   │   ├── auth/                    # Login, signup, me, logout, demo endpoints
│   │   │   ├── billing/checkout/route.ts# Payment adapter endpoint
│   │   │   ├── keys/route.ts            # Virtual API key generation & revocation
│   │   │   └── v1/chat/completions/     # Core OpenAI-compatible reverse proxy
│   │   ├── dashboard/page.tsx           # Command Center with live telemetry
│   │   ├── docs/page.tsx                # Developer documentation & quickstarts
│   │   ├── login/page.tsx               # Auth portal with 1-Click Evaluator access
│   │   ├── pricing/page.tsx             # Pricing tiers, ROI calculator & waitlist
│   │   ├── signup/page.tsx              # User registration portal
│   │   ├── layout.tsx                   # Root layout & font configurations
│   │   └── page.tsx                     # Landing page with Visualizer & Roadmap
│   ├── components/
│   │   ├── ArchitectureVisualizer.tsx   # Interactive 5-stage packet inspection
│   │   ├── KeyManagerModal.tsx          # Virtual key creation & revocation modal
│   │   ├── MetricCards.tsx              # Dynamically formatted KPI statistics
│   │   ├── Navbar.tsx                   # Navigation with live status & key selector
│   │   ├── ProductRoadmap.tsx           # Transparent 3-phase delivery roadmap
│   │   ├── QuickStart.tsx               # 1-click multi-language copyable snippets
│   │   ├── SecuritySandbox.tsx          # Split-screen live PII firewall testing
│   │   └── TelemetryFeed.tsx            # Real-time PostgreSQL audit log feed
│   ├── lib/
│   │   ├── auth/                        # Decoupled HMAC & session management
│   │   ├── billing/                     # Modular payment adapter (Stripe/Safepay/Mock)
│   │   ├── cache-engine.ts              # Deterministic SHA-256 L1 cache engine
│   │   ├── pii-engine.ts                # Linear ReDoS-resistant PII firewall
│   │   ├── proxy-router.ts              # Multi-provider failover router
│   │   └── supabase.ts                  # Supabase client & in-memory fallback
│   └── types/                           # Complete TypeScript interfaces
├── supabase/
│   └── schema.sql                       # Production PostgreSQL DDL & RLS policies
├── scripts/
│   ├── test-engine.mjs                  # Core engine validation suite
│   ├── test-live-api.mjs                # Live HTTP integration test
│   └── verify-supabase.mjs              # Direct PostgreSQL table verification
├── public/                              # Static brand assets and SVGs
├── README.md                            # Comprehensive product documentation
└── package.json                         # Project dependencies and build scripts
```

---

## 🛠️ Local Setup & Development Guide

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or yarn

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Hamidcodedot/devvproxy-saylani-assignment-2.git
cd devvproxy-saylani-assignment-2
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the root directory:
```env
# Optional: Supabase PostgreSQL (Falls back to in-memory store if omitted)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional: Upstream Providers (Falls back to mock simulator if omitted)
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...

# Core Session Secret
SESSION_SECRET=devvproxy-production-super-secret-key-2026
```

### 3. Run Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🧪 Automated Verification & Test Suite

DevvProxy includes a comprehensive test suite covering unit, integration, and security checks:

```bash
# 1. Test Core Engine (PII Regex, Luhn, Cache Hashing, Key Collision)
node scripts/test-engine.mjs

# 2. Test Live HTTP Gateway (Proxy, Cache Hit, Failover, Telemetry)
node scripts/test-live-api.mjs

# 3. Test Demo Reset & Zero-State Metrics
node scratch/test-demo-reset.mjs
```

### Test Verification Results
```
=== RUNNING DEVVOX ENGINE AUDIT SUITE ===
✓ PII Masking: Credit Card (Luhn) Redacted successfully
✓ PII Masking: Email Address Redacted successfully
✓ PII Masking: SSN Redacted successfully
✓ PII Masking: API Key Redacted successfully
✓ Deterministic Cache: Identical SHA-256 fingerprint generated
✓ Cross-Tenant Isolation: Tenant-scoped cache keys distinct
✓ Multi-Provider Failover: Rerouted from primary to secondary in 14ms
✓ Demo Reset: All metrics cleanly return to 0
ALL TEST SUITES PASSED (100% SUCCESS)
```

---

## 🗺️ Product Roadmap & Phased Delivery

```mermaid
timeline
    title DevvProxy Commercial Evolution
    Phase 1 (v1.0.0 Live) : OpenAI Wire-Compatibility
                          : Linear ReDoS-Safe PII Sanitizer
                          : Deterministic SHA-256 0ms Cache
                          : Multi-Provider Failover (OpenAI ➔ Groq)
                          : Live Supabase PostgreSQL Telemetry
                          : 1-Click Evaluator Mode
    Phase 2 (v1.1.0 Q4)   : Chunked SSE Streaming (stream=true)
                          : Stripe & Safepay Automated Webhooks
                          : Distributed Redis Rate Limiting
                          : Custom Regex Pattern Builder
    Phase 3 (v2.0.0 Future): Semantic Vector Caching (pgvector)
                          : SOC2 & HIPAA Audit Export Logs
                          : Multi-seat RBAC Workspaces
                          : Global Multi-Region Edge Mesh
```

- **Phase 1 (v1.0.0 — Live):** Drop-in OpenAI wire compatibility, in-flight PII redaction, 0ms deterministic cache, multi-provider failover, and Supabase audit logging.
- **Phase 2 (v1.1.0 — In Progress):** Real-time chunked Server-Sent Events (SSE) streaming de-masking, automated Stripe & Safepay billing webhooks, and distributed Redis rate limiting.
- **Phase 3 (v2.0.0 — Future):** Semantic vector caching using `pgvector`, SOC2/HIPAA compliance audit exports, and multi-tenant team workspaces.

---

## 👨‍💻 Author & License

- **Author:** Solo Technical Founder ([devvkit.com](https://devvkit.com))
- **Student Submission:** Saylani Web & AI Course — Assignment 2
- **License:** Open Source under the [MIT License](LICENSE)
- **Repository:** [https://github.com/Hamidcodedot/devvproxy-saylani-assignment-2](https://github.com/Hamidcodedot/devvproxy-saylani-assignment-2)

<div align="center">
  <sub>Engineered with precision for speed, security, and developer privacy.</sub>
</div>

