'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Zap,
  ArrowRight,
  Lock,
  RefreshCw,
  Terminal,
  ExternalLink,
  CheckCircle2,
  Cpu,
  Clock,
  Copy,
  Check,
  Menu,
  X,
  ChevronDown,
  Gauge,
  Code2,
} from 'lucide-react';
import { ArchitectureVisualizer } from '@/components/ArchitectureVisualizer';
import { ProductRoadmap } from '@/components/ProductRoadmap';

type CodeLang = 'python' | 'typescript' | 'curl';

interface CodeExample {
  title: string;
  before: string;
  after: string;
}

const CODE_EXAMPLES: Record<CodeLang, CodeExample> = {
  python: {
    title: 'Python (Official OpenAI SDK)',
    before: `from openai import OpenAI

client = OpenAI(
    api_key="sk-..."  # Directly to OpenAI
)
# Risks:
# - Raw customer PII sent to cloud
# - Full price on repetitive prompts
# - Unprotected against agent loops`,
    after: `from openai import OpenAI

client = OpenAI(
    base_url="https://devvproxy.vercel.app/api/v1",
    api_key="devv_live_demo_9481b37c"
)
# Protections:
# - Edge PII Redaction Active (Cards, SSNs)
# - 0ms Exact SHA-256 Cache Active (100% saved)
# - Sliding-Window Rate Limiter Active (60 RPM)`,
  },
  typescript: {
    title: 'TypeScript / Node.js (OpenAI SDK)',
    before: `import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
// Risks:
// - PII leakage into model providers
// - High latency on duplicate calls
// - Vulnerable to OpenAI 500 outages`,
    after: `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://devvproxy.vercel.app/api/v1',
  apiKey: process.env.DEVVPROXY_API_KEY,
});
// Protections:
// - Edge PII Sanitization Active
// - 0ms Deterministic Cache Active
// - Automatic Failover to Groq / LLaMA`,
  },
  curl: {
    title: 'cURL / Direct HTTP Wire Protocol',
    before: `curl https://api.openai.com/v1/chat/completions \\
  -H "Authorization: Bearer sk-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Process invoice"}]
  }'`,
    after: `curl https://devvproxy.vercel.app/api/v1/chat/completions \\
  -H "Authorization: Bearer devv_live_demo_9481b37c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Process invoice"}]
  }'`,
  },
};

const FAQS = [
  {
    q: 'Do I have to change my application code or install a proprietary SDK?',
    a: 'No. DevvProxy is 100% wire-compatible with the official OpenAI protocol. You only point baseURL (or base_url) to DevvProxy and pass your Virtual API Key. It works seamlessly with the official OpenAI Python/Node SDKs, LangChain, LlamaIndex, and Vercel AI SDK.',
  },
  {
    q: 'Does DevvProxy store, inspect, or train on my prompt data?',
    a: 'Absolutely not. DevvProxy enforces a strict Zero Data Retention (ZDR) policy on prompt contents. PII redaction and cache lookups happen ephemerally in-memory at the edge. The database only records operational telemetry (token counts, latency, status codes, and anonymized scrub counts).',
  },
  {
    q: 'How does the 0ms cache avoid serving stale data on time-sensitive queries?',
    a: 'DevvProxy uses deterministic canonical SHA-256 hashing scoped by tenant and model. Cache keys incorporate exact message sequences, temperature, tool choices, and response formats. Furthermore, users can selectively bypass cache by passing standard no-cache headers or unique session seeds.',
  },
  {
    q: 'What happens when OpenAI experiences an outage or rate limit (HTTP 429/500)?',
    a: 'DevvProxy features automatic zero-downtime provider failover. If OpenAI returns an HTTP 429, 500, or times out, our edge router automatically translates the payload and routes to Groq (LLaMA 3.3 70B) in under 300ms without client application error.',
  },
  {
    q: 'Does DevvProxy support SSE streaming (stream: true)?',
    a: 'DevvProxy v1.0 enforces privacy filtering, rate limiting, and 0ms caching on standard non-streaming completions. Chunked SSE streaming with real-time token de-masking is currently in active development for v1.1 (Phase 2).',
  },
];

const ROTATING_TERMS = [
  'Cost Firewall',
  'PII Data Shield',
  '0ms Cache Layer',
  'Outage Router',
];

export default function HomePage() {
  const [activeLang, setActiveLang] = useState<CodeLang>('python');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedQuickstart, setCopiedQuickstart] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [heroTerminalTab, setHeroTerminalTab] = useState<'request' | 'response'>('request');
  const [isSimulatingWire, setIsSimulatingWire] = useState(false);
  const [currentTermIndex, setCurrentTermIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTermIndex((prev) => (prev + 1) % ROTATING_TERMS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const quickstartCommand = `curl -X POST https://devvproxy.vercel.app/api/v1/chat/completions \\
  -H "Authorization: Bearer devv_live_demo_9481b37c" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello DevvProxy"}]}'`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeLang].after);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleCopyQuickstart = () => {
    navigator.clipboard.writeText(quickstartCommand);
    setCopiedQuickstart(true);
    setTimeout(() => setCopiedQuickstart(false), 2000);
  };

  const handleSimulateWire = () => {
    setIsSimulatingWire(true);
    setTimeout(() => {
      setIsSimulatingWire(false);
      setHeroTerminalTab('response');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background text-[#f4f4f5] flex flex-col font-sans selection:bg-primary/20 selection:text-primary relative overflow-x-hidden">
      {/* Ambient Blueprint Grid & Soft Emerald Halo */}
      <div className="absolute inset-0 bg-blueprint-grid mask-radial-fade pointer-events-none -z-10 h-[960px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-emerald-500/2 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation */}
      <header className="border-b border-border-subtle bg-surface-0/80 backdrop-blur-md px-4 sm:px-8 h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded bg-surface-2 border border-border-subtle flex items-center justify-center text-primary group-hover:border-primary/50 transition-colors">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-sans text-lg font-bold tracking-tight text-white">
              Devv<span className="text-primary">Proxy</span>
            </span>
          </Link>
          <a
            href="https://devvkit.com"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-[10px] font-mono text-zinc-400 hover:text-white transition-colors ml-1"
          >
            devvkit ecosystem
          </a>
        </div>

        {/* Desktop & Tablet Navigation Links */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-3 lg:gap-5 text-xs font-mono whitespace-nowrap">
          <Link href="/docs" className="text-zinc-400 hover:text-white transition-colors py-2">
            Docs
          </Link>
          <Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors py-2">
            Pricing
          </Link>
          <Link href="/login" className="text-zinc-400 hover:text-white transition-colors py-2 whitespace-nowrap">
            Sign In
          </Link>
          <Link
            href="/signup"
            className="hidden lg:inline-flex px-3.5 py-1.5 rounded bg-surface-2 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-border-subtle font-medium transition-colors"
          >
            Create Account
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-1.5 rounded bg-white hover:bg-zinc-200 text-black font-bold transition-all flex items-center gap-1.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none shrink-0"
          >
            <span>Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded bg-white text-black font-bold text-xs flex items-center gap-1"
          >
            <span>Console</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={isMobileMenuOpen}
            className="h-10 w-10 flex items-center justify-center rounded-lg bg-surface-1 border border-border-subtle text-zinc-300 hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-40 bg-surface-0 border-b border-border-subtle p-6 space-y-4 shadow-2xl animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-3 font-mono text-sm">
            <Link
              href="/docs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-md hover:bg-surface-1 text-zinc-300 hover:text-white transition-colors"
            >
              Documentation & Quickstart
            </Link>
            <Link
              href="/pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-md hover:bg-surface-1 text-zinc-300 hover:text-white transition-colors"
            >
              Pricing & Beta Plans
            </Link>
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-md hover:bg-surface-1 text-zinc-300 hover:text-white transition-colors"
            >
              Sign In to Account
            </Link>
            <Link
              href="/signup"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-md bg-surface-2 border border-border-subtle text-white font-medium text-center"
            >
              Create Free Account
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-md bg-white text-black font-bold text-center flex items-center justify-center gap-2"
            >
              <span>Launch Live Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-12 sm:py-20 space-y-20 sm:space-y-24">
        {/* Hero Section */}
        <section aria-labelledby="hero-title" className="text-center space-y-6 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-1 border border-border-subtle text-xs font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Zero-Overhead AI Gateway & Cost Firewall</span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400 font-semibold">1-Line Setup</span>
          </div>

          <h1 id="hero-title" className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.15]">
            <span>The Privacy-First AI Gateway</span>
            <br className="hidden sm:inline" />
            <span className="text-zinc-400"> &amp; </span>
            <span className="inline-flex items-center text-emerald-400">
              <span
                key={currentTermIndex}
                className="inline-block animate-in fade-in slide-in-from-bottom-2 duration-300 font-extrabold tracking-tight"
              >
                {ROTATING_TERMS[currentTermIndex]}
              </span>
              <span
                aria-hidden="true"
                className="inline-block w-[3px] sm:w-[4px] h-[0.75em] bg-emerald-400 ml-2 align-middle animate-pulse rounded-full"
              />
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 font-sans leading-relaxed max-w-2xl mx-auto">
            A drop-in reverse proxy that scrubs customer PII at the edge, cuts LLM cloud bills with 0ms deterministic caching, and halts runaway loops before your card is drained.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-mono text-xs">
            <Link
              href="/signup"
              className="min-h-[44px] px-6 py-3 rounded-md bg-white hover:bg-zinc-200 text-black font-bold flex items-center gap-2 transition-all shadow-md active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="min-h-[44px] px-6 py-3 rounded-md bg-surface-1 hover:bg-surface-2 text-zinc-300 hover:text-white border border-border-subtle transition-all flex items-center gap-2 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span>Launch Live Console</span>
            </Link>
            <Link
              href="/docs"
              className="min-h-[44px] px-5 py-3 rounded-md text-zinc-400 hover:text-white transition-colors flex items-center"
            >
              Docs & Quickstart →
            </Link>
          </div>

          {/* Interactive Floating Developer Console Window */}
          <div className="pt-6 max-w-2xl mx-auto text-left font-mono text-xs">
            <div className="rounded-xl bg-surface-1/90 backdrop-blur-md border border-border-subtle shadow-2xl overflow-hidden hover:border-zinc-700 transition-all">
              {/* Window Titlebar */}
              <div className="px-4 py-2.5 bg-surface-2/80 border-b border-border-subtle flex flex-wrap items-center justify-between gap-2">
                {/* Window Dots & Tabs */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/80 inline-block"></span>
                  </div>

                  <div className="flex items-center gap-1 bg-surface-0/60 p-0.5 rounded-md border border-border-subtle text-[11px]">
                    <button
                      onClick={() => setHeroTerminalTab('request')}
                      className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                        heroTerminalTab === 'request'
                          ? 'bg-surface-2 text-white font-semibold shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Terminal className="w-3 h-3 text-primary" />
                      <span>wire-request.sh</span>
                    </button>
                    <button
                      onClick={() => setHeroTerminalTab('response')}
                      className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                        heroTerminalTab === 'response'
                          ? 'bg-surface-2 text-white font-semibold shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Shield className="w-3 h-3 text-emerald-400" />
                      <span>edge-response.json</span>
                    </button>
                  </div>
                </div>

                {/* Status Indicator & Action Buttons */}
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>200 OK • 0ms Cache Hit</span>
                  </span>

                  <button
                    onClick={handleSimulateWire}
                    disabled={isSimulatingWire}
                    title="Simulate DevvProxy edge request inspection"
                    className="px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 text-emerald-400 border border-primary/30 flex items-center gap-1 font-semibold active:scale-95 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSimulatingWire ? 'animate-spin' : ''}`} />
                    <span>{isSimulatingWire ? 'Sending...' : 'Run Test'}</span>
                  </button>

                  <button
                    onClick={handleCopyQuickstart}
                    title="Copy command to clipboard"
                    className="p-1 sm:px-2 sm:py-1 rounded bg-surface-0 hover:bg-surface-1 border border-border-subtle text-zinc-400 hover:text-white flex items-center gap-1 transition-colors active:scale-95"
                  >
                    {copiedQuickstart ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="hidden sm:inline text-emerald-400 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Terminal Body */}
              <div className="p-4 bg-surface-editor">
                {heroTerminalTab === 'request' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-border-subtle/50 pb-1.5">
                      <span>CLIENT WIRE REQUEST • ZERO SDK REWRITE</span>
                      <span className="text-zinc-500">HTTP/1.1 POST</span>
                    </div>
                    <pre className="text-zinc-300 text-[11px] overflow-x-auto whitespace-pre leading-relaxed py-1">
                      <code>{quickstartCommand}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-border-subtle/50 pb-1.5">
                      <span className="text-emerald-400 font-semibold">EDGE PROXY INSPECTION TELEMETRY</span>
                      <span className="text-zinc-400">Deterministic SHA-256 Hit</span>
                    </div>
                    <pre className="text-emerald-300/90 text-[11px] overflow-x-auto whitespace-pre leading-relaxed py-1">
                      <code>{`{
  "id": "chatcmpl-devv_live_demo_9481b37c",
  "object": "chat.completion",
  "created": 1740000000,
  "model": "gpt-4o-mini",
  "x_devv_telemetry": {
    "cache": "HIT (0ms)",
    "tokens_saved": 48,
    "pii_scrubbed": [
      { "type": "CREDIT_CARD", "luhn": true, "mask": "[CREDIT_CARD]" },
      { "type": "EMAIL", "mask": "[EMAIL]" }
    ],
    "failover_ready": true,
    "rate_limit_remaining": "59/60 RPM"
  },
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello! DevvProxy verified your request: PII stripped at edge, 0ms cache active."
    }
  }]
}`}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4-Item Engineering Proof Bar */}
        <section aria-label="Engineering Performance Benchmarks" className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 font-mono">
          <div className="p-4 rounded-xl bg-surface-1 border border-border-subtle space-y-1 text-center">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Rate Limiting</span>
            <span className="text-xl sm:text-2xl font-bold text-white block">&lt; 0.05ms</span>
            <span className="text-[11px] text-zinc-400">In-memory sliding window</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-1 border border-border-subtle space-y-1 text-center">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Cache Latency</span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-400 block">0ms Hit</span>
            <span className="text-[11px] text-zinc-400">100% token cost saved</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-1 border border-border-subtle space-y-1 text-center">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Privacy Engine</span>
            <span className="text-xl sm:text-2xl font-bold text-white block">Luhn-Verified</span>
            <span className="text-[11px] text-zinc-400">Zero-leak CC, SSN &amp; Key masking</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-1 border border-border-subtle space-y-1 text-center">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Migration Cost</span>
            <span className="text-xl sm:text-2xl font-bold text-white block">1-Line Switch</span>
            <span className="text-[11px] text-zinc-400">Zero SDK rewrite required</span>
          </div>
        </section>

        {/* 1-Line Code Change Showcase with Multi-Language Switcher */}
        <section aria-label="Drop-in Code Switcher" className="rounded-xl bg-surface-1 border border-border-subtle p-5 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Code2 className="w-4 h-4 text-primary" />
              <span>Drop-in Wire Compatibility Across SDKs</span>
            </div>

            {/* Language Selector Tabs */}
            <div className="flex items-center gap-1.5 font-mono text-xs bg-surface-0 p-1 rounded-lg border border-border-subtle self-start sm:self-auto">
              {(['python', 'typescript', 'curl'] as CodeLang[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1 rounded transition-all ${
                    activeLang === lang
                      ? 'bg-surface-2 text-white font-bold border border-border-subtle shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {lang === 'python' ? 'Python' : lang === 'typescript' ? 'TypeScript' : 'cURL'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Before Box */}
            <div className="p-4 rounded-lg bg-surface-editor border border-border-subtle space-y-2">
              <span className="text-zinc-500 text-[11px] block"># Standard Client (Before)</span>
              <pre className="text-zinc-400 leading-relaxed overflow-x-auto text-[11px]">
                <code>{CODE_EXAMPLES[activeLang].before}</code>
              </pre>
            </div>

            {/* After Box */}
            <div className="p-4 rounded-lg bg-surface-editor border border-primary/40 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 text-[11px] block font-semibold"># With DevvProxy (After)</span>
                <button
                  onClick={handleCopySnippet}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-surface-2 border border-border-subtle text-[10px] text-zinc-300 hover:text-white transition-colors active:scale-95"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-zinc-200 leading-relaxed overflow-x-auto text-[11px]">
                <code>{CODE_EXAMPLES[activeLang].after}</code>
              </pre>
            </div>
          </div>

          {/* Footnote */}
          <div className="pt-2 text-[11px] font-mono text-zinc-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Works out-of-the-box with OpenAI, LangChain, CrewAI, AutoGen, and Vercel AI SDK.</span>
            <span className="text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-primary" />
              <span>SSE Streaming scheduled for v1.1 (Phase 2)</span>
            </span>
          </div>
        </section>

        {/* Visual Architecture Pipeline */}
        <section aria-label="Architecture Pipeline Visualizer" className="space-y-4">
          <ArchitectureVisualizer />
        </section>

        {/* The 3 AI Startup Nightmares Solved Grid */}
        <section aria-labelledby="nightmares-title" className="space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
              Architectural Invariants
            </span>
            <h2 id="nightmares-title" className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              The 3 AI Startup Nightmares Solved
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
              Designed by technical founders for production agents, autonomous loops, and high-throughput LLM workloads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Nightmare 1: Runaway Loops */}
            <div className="p-6 rounded-xl bg-surface-1 border border-border-subtle space-y-3.5 hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center text-primary">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-[10px] font-mono text-emerald-400 font-semibold">
                    &lt; 0.05ms Overhead
                  </span>
                </div>
                <h3 className="text-base font-bold font-mono text-white">
                  Runaway Loops &amp; Bill Shock Defense
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Agentic recursion or tool-calling loops can drain your OpenAI credits in minutes. Our in-memory sliding window rate limiter halts loops at the edge before you wake up to a $1,000 billing surprise.
                </p>
              </div>
              <div className="pt-3 border-t border-border-subtle text-[11px] font-mono text-zinc-500">
                Key-level RPM &amp; Client-IP Throttling
              </div>
            </div>

            {/* Nightmare 2: Customer PII Leaks */}
            <div className="p-6 rounded-xl bg-surface-1 border border-border-subtle space-y-3.5 hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center text-primary">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-[10px] font-mono text-emerald-400 font-semibold">
                    ReDoS Safe
                  </span>
                </div>
                <h3 className="text-base font-bold font-mono text-white">
                  Zero-Leak Compliance Firewall
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  End users inevitably paste credit cards, SSNs, API tokens, and emails into prompts. DevvProxy verifies cards via mathematical Luhn checksums and scrubs them before packets ever touch model providers.
                </p>
              </div>
              <div className="pt-3 border-t border-border-subtle text-[11px] font-mono text-zinc-500">
                GDPR &amp; SOC2 Data Leak Prevention
              </div>
            </div>

            {/* Nightmare 3: Upstream Outages */}
            <div className="p-6 rounded-xl bg-surface-1 border border-border-subtle space-y-3.5 hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center text-primary">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-[10px] font-mono text-emerald-400 font-semibold">
                    &lt; 300ms Failover
                  </span>
                </div>
                <h3 className="text-base font-bold font-mono text-white">
                  Zero-Downtime Outage Failover
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  When OpenAI returns HTTP 429 rate limits, 500 errors, or suffers global downtime, DevvProxy automatically reroutes traffic to Groq (LLaMA 3.3 70B) with zero client application crashes.
                </p>
              </div>
              <div className="pt-3 border-t border-border-subtle text-[11px] font-mono text-zinc-500">
                Automated Model Translation &amp; Retries
              </div>
            </div>
          </div>
        </section>

        {/* Product Roadmap Section */}
        <section aria-label="Product Roadmap">
          <ProductRoadmap />
        </section>

        {/* Technical Developer FAQ Section */}
        <section aria-labelledby="faq-title" className="space-y-8 max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
              Architectural Clarity
            </span>
            <h2 id="faq-title" className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
              Straightforward, technical answers for developers evaluating Layer 1 AI gateway infrastructure.
            </p>
          </div>

          <div className="space-y-3 font-mono">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={faq.q}
                  className={`rounded-lg border transition-all ${
                    isOpen
                      ? 'bg-surface-1 border-primary/40 shadow-sm'
                      : 'bg-surface-0 border-border-subtle hover:border-zinc-700'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
                  >
                    <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-zinc-300 font-sans leading-relaxed border-t border-border-subtle/50 mt-1">
                      <p className="pt-3">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Ecosystem Continuity Banner */}
        <div className="p-6 rounded-xl bg-surface-1 border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-surface-2 text-primary border border-border-subtle">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-mono">
                Part of the devvkit.com Ecosystem
              </h4>
              <p className="text-xs text-zinc-400 font-sans">
                Extending privacy-first developer utilities into Layer 1 cloud infrastructure.
              </p>
            </div>
          </div>

          <a
            href="https://devvkit.com"
            target="_blank"
            rel="noreferrer"
            className="min-h-[44px] px-4 py-2 rounded-md bg-surface-2 hover:bg-zinc-800 text-xs font-mono text-zinc-300 hover:text-white border border-border-subtle flex items-center gap-2 transition-colors shrink-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <span>Visit devvkit.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-surface-0 py-8 px-4 sm:px-8 text-xs font-mono text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>DevvProxy v1.0 • Privacy-First by Design</span>
          </div>
          <div className="flex items-center gap-5 text-zinc-400">
            <Link href="/docs" className="hover:text-white transition-colors py-1">Docs</Link>
            <Link href="/pricing" className="hover:text-white transition-colors py-1">Pricing</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors py-1">Console</Link>
            <a
              href="https://github.com/Hamidcodedot/devvproxy-saylani-assignment-2"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors py-1"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
