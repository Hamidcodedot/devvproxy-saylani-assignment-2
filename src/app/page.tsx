'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Zap,
  ArrowRight,
  Lock,
  RefreshCw,
  Terminal,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Cpu,
  Clock,
} from 'lucide-react';
import { ArchitectureVisualizer } from '@/components/ArchitectureVisualizer';
import { ProductRoadmap } from '@/components/ProductRoadmap';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-[#f4f4f5] flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Top Navigation */}
      <nav className="border-b border-border-subtle bg-surface-0 px-4 sm:px-8 h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-surface-2 border border-border-subtle flex items-center justify-center text-primary">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-sans text-lg font-bold tracking-tight text-white">
            Devv<span className="text-primary">Proxy</span>
          </span>
          <a
            href="https://devvkit.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-[10px] font-mono text-zinc-400 hover:text-white transition-colors ml-1"
          >
            devvkit ecosystem
          </a>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <Link href="/docs" className="text-zinc-400 hover:text-white transition-colors">
            Docs
          </Link>
          <Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            href="/signup"
            className="hidden sm:inline-flex px-3 py-1.5 rounded bg-surface-2 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-border-subtle font-medium transition-colors"
          >
            Create Account
          </Link>
          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 rounded bg-white hover:bg-zinc-200 text-black font-bold transition-all flex items-center gap-1.5"
          >
            <span>Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-24">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-1 border border-border-subtle text-xs font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Edge AI Firewall & Caching Gateway</span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400 font-semibold">1-Line Setup</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.15]">
            The Privacy-First AI Gateway & Cost Firewall
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 font-sans leading-relaxed max-w-2xl mx-auto">
            A drop-in reverse proxy that scrubs customer PII at the edge, cuts LLM cloud bills with 0ms deterministic caching, and guarantees zero-downtime failover.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-mono text-xs">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-md bg-white hover:bg-zinc-200 text-black font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-md bg-surface-1 hover:bg-surface-2 text-zinc-300 hover:text-white border border-border-subtle transition-all flex items-center gap-2"
            >
              <span>Launch Live Console</span>
            </Link>
            <Link
              href="/docs"
              className="px-5 py-3 rounded-md text-zinc-400 hover:text-white transition-colors"
            >
              Docs & Quickstart →
            </Link>
          </div>
        </div>

        {/* 1-Line Code Change Showcase */}
        <div className="rounded-xl bg-surface-1 border border-border-subtle p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Terminal className="w-4 h-4 text-primary" />
              <span>Zero Application Code Refactoring Required</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">Works with OpenAI, LangChain, Vercel AI SDK</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Standard OpenAI Code */}
            <div className="p-4 rounded-lg bg-surface-editor border border-border-subtle space-y-2">
              <span className="text-zinc-500 text-[11px] block"># Standard OpenAI SDK (Before)</span>
              <pre className="text-zinc-400 leading-relaxed overflow-x-auto">
                <code>{`from openai import OpenAI

client = OpenAI(
    api_key="sk-..."  # Directly to OpenAI
)
# Risks: Unmasked PII sent to cloud
# High cost on repetitive queries`}</code>
              </pre>
            </div>

            {/* DevvProxy 1-Line Switch */}
            <div className="p-4 rounded-lg bg-surface-editor border border-primary/40 space-y-2 relative">
              <div className="absolute top-3 right-3 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">
                1 LINE CHANGE
              </div>
              <span className="text-emerald-400 text-[11px] block font-semibold"># With DevvProxy (After)</span>
              <pre className="text-zinc-200 leading-relaxed overflow-x-auto">
                <code>{`from openai import OpenAI

client = OpenAI(
    base_url="https://devvproxy.vercel.app/api/v1",
    api_key="devv_live_demo_9481b37c"
)
# Edge PII Redaction Active (Cards, SSNs, Emails)
# 0ms Exact SHA-256 Cache Active (100% savings)`}</code>
              </pre>
            </div>
          </div>

          {/* Compatibility & Disclosure Footnote */}
          <div className="pt-2 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
            <span>Compatible with any OpenAI wire-protocol client (Python, Node.js, cURL).</span>
            <span className="text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-primary" />
              <span>SSE Streaming scheduled for v1.1 (Phase 2)</span>
            </span>
          </div>
        </div>

        {/* Visual Architecture Pipeline */}
        <section aria-label="Architecture Pipeline Visualizer">
          <ArchitectureVisualizer />
        </section>

        {/* 3 Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="p-6 rounded-lg bg-surface-1 border border-border-subtle space-y-3">
            <div className="h-9 w-9 rounded bg-surface-2 border border-border-subtle flex items-center justify-center text-primary">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold font-mono text-white">
              Edge PII Sanitization
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Linear-time regex engine validates credit cards via mathematical Luhn checksum and masks SSNs, emails, and API keys before packets reach external LLM servers.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-lg bg-surface-1 border border-border-subtle space-y-3">
            <div className="h-9 w-9 rounded bg-surface-2 border border-border-subtle flex items-center justify-center text-primary">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold font-mono text-white">
              0ms Deterministic Cache
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Identical queries bypass upstream models completely. Responses return in under 5ms, saving 100% of token costs while eliminating duplicate API spend.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-lg bg-surface-1 border border-border-subtle space-y-3">
            <div className="h-9 w-9 rounded bg-surface-2 border border-border-subtle flex items-center justify-center text-primary">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold font-mono text-white">
              Zero-Downtime Outage Failover
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              If OpenAI returns an HTTP 429 rate limit or experiences an outage, DevvProxy automatically reroutes traffic to Groq / LLaMA with model translation.
            </p>
          </div>
        </div>

        {/* Product Roadmap Section */}
        <section aria-label="Product Roadmap">
          <ProductRoadmap />
        </section>

        {/* Ecosystem Continuity Banner */}
        <div className="p-6 rounded-xl bg-surface-1 border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-surface-2 text-primary">
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
            className="px-4 py-2 rounded bg-surface-2 hover:bg-zinc-800 text-xs font-mono text-zinc-300 hover:text-white border border-border-subtle flex items-center gap-1.5 transition-colors shrink-0"
          >
            <span>Visit devvkit.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-surface-0 py-8 px-4 sm:px-8 text-center text-xs font-mono text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>DevvProxy v1.0 • Privacy-First by Design</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-white transition-colors">Console</Link>
            <a
              href="https://github.com/Hamidcodedot/devvproxy-saylani-assignment-2"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
