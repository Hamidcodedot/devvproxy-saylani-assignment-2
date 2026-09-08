# DevvProxy — Privacy-First AI Gateway & Cost Firewall

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase PostgreSQL](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat&logo=supabase)](https://supabase.com/)
[![Ecosystem](https://img.shields.io/badge/Part%20of-devvkit.com-10b981?style=flat)](https://devvkit.com)

**DevvProxy** is the Layer 1 cloud infrastructure platform in the **Devv ecosystem** (extending [devvkit.com](https://devvkit.com)). It is a high-performance, drop-in reverse proxy compatible with the OpenAI API specification that enforces **edge PII redaction**, provides **0ms deterministic SHA-256 caching** (100% token savings), guarantees **automatic failover** during outages, and logs real-time security and cost telemetry into **Supabase PostgreSQL**.

---

## 🌟 Key Features

1. **Zero-Code-Refactor (1-Line Change):**
   Compatible with any OpenAI SDK, LangChain, or Vercel AI SDK simply by changing `baseURL`:
   ```python
   from openai import OpenAI
   client = OpenAI(
       base_url="https://devvproxy.vercel.app/api/v1", # DevvProxy Gateway
       api_key="devv_live_demo_9481b37c"
   )
   ```

2. **ReDoS-Resistant Edge PII Firewall:**
   Automatically detects and masks sensitive data before forwarding payloads to third-party LLMs:
   - **Credit Cards:** 13–19 digits validated with the mathematical **Luhn Algorithm**.
   - **Emails:** Linear non-backtracking RFC 5322 regex.
   - **US SSNs:** `\d{3}-\d{2}-\d{4}` pattern.
   - **Phone Numbers:** US and international E.164 formats.
   - **Leaked API Keys:** `sk-...`, `ghp_...`, AWS access keys.

3. **0ms Deterministic Cache (100% Token Savings):**
   - SHA-256 canonical hashing ensures `{role: "user", content: "hi"}` and `{content: "hi", role: "user"}` match identically.
   - Scoped by `key_id` to prevent cross-tenant cache collisions.
   - Reduces latency from ~1,200ms to **< 5ms** at **$0.00** cost.

4. **Multi-Provider Resilience & Auto-Failover:**
   - Primary upstream: OpenAI (`gpt-4o-mini`, `gpt-4o`).
   - On 429 rate limit, 5xx outage, or 8s timeout, silently fails over to Groq (`llama-3.3-70b-versatile`).
   - High-fidelity **Mock Simulator** guarantees 100% functional live demonstrations even offline.

5. **Production Multi-Page Platform & Evaluator Mode:**
   - **Landing Page (`/`):** Clean monochrome hero, interactive 1-line code diff, feature pillars, and ecosystem bar.
   - **Interactive Pricing & ROI Calculator (`/pricing`):** Free Hobby ($0), Pro ($29), and Enterprise ($199) tiers with real-time interactive monthly ROI savings slider.
   - **Developer Docs (`/docs`):** Complete API specifications, cURL / Python examples, PII rules, and HTTP response headers.
   - **Course Evaluator Mode (`/login`):** Instant 1-Click Demo Login bypassing email verification for rapid grading.
   - **Command Center (`/dashboard`):** Real-time analytics, side-by-side security sandbox, and virtual API key management.

6. **Decoupled Reusable Auth & Billing Modules:**
   - Standalone, modular architecture (`src/lib/auth/` and `src/lib/billing/`) designed as portable boilerplates.
   - Can be copied into any future SaaS platform in minutes with zero dependencies on external monolithic clusters.
   - Provider-agnostic payment adapter supporting Stripe, Safepay, and Mock gateways.

7. **Minimalist Monochrome Design (`devvkit.com` Standard):**
   - Strictly engineered with solid matte dark surfaces (`#09090b`, `#121215`), 1px zinc borders (`#27272a`), Inter typography, and subtle emerald accents.
   - Completely free of heavy glassmorphism, distracting multi-color glows, or bloated UI kits.

---

## 🏗️ Architecture

```
                                    +-----------------------------------------------+
                                    |                  Client App                   |
                                    |    (cURL / Python OpenAI SDK / Web Sandbox)   |
                                    +-----------------------+-----------------------+
                                                            |
                                     POST /api/v1/chat/completions (Bearer devv_live_...)
                                                            v
+-------------------------------------------------------------------------------------------------------------------+
| DevvProxy Core Engine (Next.js 15 App Router - Node.js Runtime)                                                   |
|                                                                                                                   |
|  [Step 1: Auth & Rate Limit]  --> O(1) SHA-256 lookup on `api_keys.key_hash` with in-memory hot cache              |
|                                                                                                                   |
|  [Step 2: PII Redaction Engine] -> Linear-time non-backtracking regex (Emails, Phones, Luhn Cards, SSNs, Secrets)  |
|                                                                                                                   |
|  [Step 3: Deterministic Cache] -> SHA-256(key_id + model + canonical(messages) + temperature)                    |
|       |                                                                                                           |
|       +--> [CACHE HIT] ---------> Returns cached response (< 5ms, $0 cost, 100% tokens saved)                     |
|       |                                                                                                           |
|       +--> [CACHE MISS] --------> [Step 4: Upstream Dispatcher with Failover]                                     |
|                                        |                                                                          |
|                                        +--> Primary: OpenAI (gpt-4o-mini) [8s timeout]                            |
|                                        |      | (on 429 Rate Limit, 5xx Outage, or Timeout)                       |
|                                        |      v                                                                   |
|                                        +--> Fallback: Groq (llama-3.3-70b-versatile)                              |
|                                        |      | (if offline / keys missing)                                       |
|                                        |      v                                                                   |
|                                        +--> Fallback: High-Fidelity Mock Simulator (120ms realistic delay)        |
|                                                                                                                   |
|  [Step 5: Non-Blocking Telemetry] -> Uses Next.js 15 `after()` to write logs to Supabase asynchronously           |
+-------------------------------------------------------------------------------------------------------------------+
                                                            |
                                                            v
                                            +-------------------------------+
                                            |      DevvProxy Dashboard      |
                                            |   - Live KPI Metrics          |
                                            |   - Side-by-Side PII Sandbox  |
                                            |   - Real-Time Audit Feed      |
                                            |   - Virtual API Key Manager   |
                                            |   - 1-Click Code Snippets     |
                                            +-------------------------------+
```

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone https://github.com/your-username/devvproxy.git
cd devvproxy
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(Note: The platform works 100% out of the box with zero external configuration using its built-in in-memory store and mock simulator).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the Command Center.

### 4. Run Automated Test Suite
```bash
npx tsx scripts/test-engine.mjs
node scripts/test-live-api.mjs
```

---

## 🔒 Security Audit & Hardening Checklist

- [x] **OWASP A02:2021 Cryptographic Security:** No plaintext third-party keys stored in database. Virtual keys hashed with SHA-256.
- [x] **ReDoS Protection:** All regular expressions use bounded linear execution with a 50KB input scan limit.
- [x] **Luhn Checksum:** Credit card numbers are validated mathematically before redaction.
- [x] **Anti-Collision Caching:** Cache keys are scoped by tenant ID and canonical raw query to prevent placeholder collisions.
- [x] **Non-Blocking Telemetry:** Asynchronous database writes using Next.js 15 `after()`.

---

## 📊 Commercial Roadmap (Beyond MVP)

1. **v1.1:** Real-time chunked SSE streaming de-masking.
2. **v1.2:** Semantic Vector Caching using pgvector.
3. **v2.0:** Multi-seat enterprise RBAC, custom regex rule builder, and SOC2/HIPAA compliance audit exports.

---

## 🎓 Course Assignment Details
- **Course:** Saylani Web & AI Course (Assignment 2)
- **Author:** Solo Technical Founder (Creator of devvkit.com)
- **Deployment Target:** Vercel + Supabase Cloud
