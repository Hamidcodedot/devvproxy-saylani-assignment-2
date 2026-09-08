'use client';

import React from 'react';
import {
  Milestone,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  Zap,
  RefreshCw,
  CreditCard,
  Sliders,
  Layers,
  FileCheck,
} from 'lucide-react';

interface MilestonePhase {
  phase: string;
  version: string;
  badge: string;
  badgeType: 'live' | 'progress' | 'future';
  timing: string;
  title: string;
  description: string;
  items: { text: string; done: boolean }[];
}

const PHASES: MilestonePhase[] = [
  {
    phase: 'Phase 1',
    version: 'v1.0.0',
    badge: 'Live in Production',
    badgeType: 'live',
    timing: 'Current Active Release',
    title: 'Zero-Friction Gateway & Privacy Core',
    description: 'High-performance drop-in reverse proxy with zero application refactoring.',
    items: [
      { text: 'OpenAI Wire-Compatible Chat Completions (/api/v1)', done: true },
      { text: 'Linear ReDoS-Safe PII Sanitizer with Luhn CC Validation', done: true },
      { text: 'Deterministic SHA-256 0ms Cache (100% Token Savings)', done: true },
      { text: 'Multi-Provider Failover (OpenAI ➔ Groq / Compound-Mini)', done: true },
      { text: 'Live Supabase PostgreSQL Telemetry & Audit Logs', done: true },
      { text: '1-Click Evaluator Mode with Instant Demo Credentials', done: true },
    ],
  },
  {
    phase: 'Phase 2',
    version: 'v1.1.0',
    badge: 'Coming in v1.1',
    badgeType: 'progress',
    timing: 'Q4 2026 • In Development',
    title: 'Streaming Engine & Monetization',
    description: 'Expanding compatibility to chunked streaming and automated payment infrastructure.',
    items: [
      { text: 'Chunked SSE Streaming De-masking (stream: true support)', done: false },
      { text: 'Automated Stripe & Safepay Subscription Webhooks', done: false },
      { text: 'Distributed Sliding-Window Rate Limiting (Redis / Upstash)', done: false },
      { text: 'Custom Regex Pattern Rule Builder in Dashboard', done: false },
      { text: 'Virtual Key Quota Limits & Spend Alert Webhooks', done: false },
    ],
  },
  {
    phase: 'Phase 3',
    version: 'v2.0.0',
    badge: 'Future Roadmap',
    badgeType: 'future',
    timing: '2027 • Long-Term Vision',
    title: 'Enterprise Compliance & Semantic Layer',
    description: 'Full-scale enterprise security firewall for regulated industries.',
    items: [
      { text: 'Semantic Vector Caching with pgvector similarity thresholds', done: false },
      { text: 'SOC2 Type II & HIPAA Automated Compliance Export Logs', done: false },
      { text: 'Multi-seat Enterprise Workspaces with Role-Based Access (RBAC)', done: false },
      { text: 'Global Multi-Region Edge Mesh (Fly.io / Cloudflare Workers)', done: false },
      { text: 'Zero Data Retention (ZDR) Cryptographic Proofs', done: false },
    ],
  },
];

export function ProductRoadmap() {
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-2 border border-border-subtle text-[11px] font-mono text-zinc-400">
          <Milestone className="w-3.5 h-3.5 text-primary" />
          <span>Product Evolution</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
          DevvProxy Commercial Roadmap
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
          From a focused 48-hour privacy & caching MVP to an enterprise-grade AI cloud firewall. Transparently phased for reliability.
        </p>
      </div>

      {/* 3 Phases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {PHASES.map((phase) => {
          const isLive = phase.badgeType === 'live';
          const isProgress = phase.badgeType === 'progress';

          return (
            <div
              key={phase.version}
              className={`p-6 rounded-xl border flex flex-col justify-between space-y-6 transition-all ${
                isLive
                  ? 'bg-surface-1 border-primary/40 shadow-lg relative ring-1 ring-primary/20'
                  : isProgress
                  ? 'bg-surface-1 border-border-subtle hover:border-zinc-700'
                  : 'bg-surface-0/60 border-border-subtle opacity-90'
              }`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
                  <div>
                    <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
                      {phase.phase} • {phase.timing}
                    </span>
                    <span className="font-mono text-lg font-bold text-white tracking-tight">
                      {phase.version}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold flex items-center gap-1 shrink-0 ${
                      isLive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isProgress
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-surface-2 text-zinc-400 border border-border-subtle'
                    }`}
                  >
                    {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                    {isProgress && <Clock className="w-2.5 h-2.5" />}
                    <span>{phase.badge}</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-mono text-sm font-bold text-white mb-1">
                    {phase.title}
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    {phase.description}
                  </p>
                </div>

                {/* Checklist */}
                <ul className="space-y-2.5 pt-2 text-xs font-mono">
                  {phase.items.map((item) => (
                    <li key={item.text} className="flex items-start gap-2 text-zinc-300">
                      {item.done ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded border border-zinc-600 shrink-0 mt-0.5 flex items-center justify-center text-[9px] text-zinc-500">
                          •
                        </div>
                      )}
                      <span className={item.done ? 'text-zinc-200' : 'text-zinc-400'}>
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-border-subtle/70">
                {isLive ? (
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold block text-center">
                    ✓ Deployed & Verified Live
                  </span>
                ) : isProgress ? (
                  <span className="text-[11px] font-mono text-primary font-semibold block text-center">
                    ⏳ Scheduled for v1.1
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-zinc-500 block text-center">
                    Architecture Phase
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
