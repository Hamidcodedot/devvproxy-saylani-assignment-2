'use client';

import React, { useState } from 'react';
import {
  Terminal,
  Shield,
  Zap,
  RefreshCw,
  Database,
  Cpu,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface Stage {
  id: string;
  step: string;
  title: string;
  badge: string;
  latency: string;
  description: string;
  techDetails: string;
  icon: React.ComponentType<{ className?: string }>;
  sampleTransformation?: {
    inputLabel: string;
    inputValue: string;
    outputLabel: string;
    outputValue: string;
    statusBadge: string;
  };
}

const STAGES: Stage[] = [
  {
    id: 'client',
    step: '01',
    title: 'Client App',
    badge: 'OpenAI SDK / cURL',
    latency: '0ms',
    description: 'Existing client application makes a standard OpenAI chat completion request by simply setting baseURL to DevvProxy.',
    techDetails: 'Drop-in wire compatibility. Zero refactoring required in application logic.',
    icon: Terminal,
    sampleTransformation: {
      inputLabel: 'Client Configuration',
      inputValue: 'from openai import OpenAI\nclient = OpenAI(base_url="https://devvproxy.com/api/v1")',
      outputLabel: 'Wire Protocol Target',
      outputValue: 'POST /api/v1/chat/completions\nAuthorization: Bearer devv_live_9481...',
      statusBadge: '100% Wire Compatible',
    },
  },
  {
    id: 'ratelimit',
    step: '02',
    title: 'Edge Rate Limiter',
    badge: 'Sliding Window',
    latency: '< 0.05ms',
    description: 'High-speed in-memory sliding window counter enforces requests-per-minute (RPM) limits per Virtual Key, halting runaway loops.',
    techDetails: 'O(K) time complexity in Node runtime. Prevents unexpected billing surges without external Redis overhead.',
    icon: Gauge,
    sampleTransformation: {
      inputLabel: 'Incoming Request Volume',
      inputValue: 'Key: devv_live_demo_9481b37c\nBurst: 5 requests in 200ms window',
      outputLabel: 'Rate Limit Headers Injected',
      outputValue: 'X-RateLimit-Limit-Requests: 120\nX-RateLimit-Remaining-Requests: 115\nX-RateLimit-Reset-Requests: 58s',
      statusBadge: 'Within Quota (PASS)',
    },
  },
  {
    id: 'pii',
    step: '03',
    title: 'PII Sanitizer',
    badge: 'Luhn + ReDoS Shield',
    latency: '< 2ms',
    description: 'Linear-time regex engine scrubs credit card numbers (validated via Luhn algorithm), SSNs, emails, and API keys before forwarding.',
    techDetails: 'Protects proprietary corporate data from leaking into external model training datasets.',
    icon: Shield,
    sampleTransformation: {
      inputLabel: 'Raw Client Input',
      inputValue: '"Process invoice for client john@corp.com with card 4532-1188-9922-3344"',
      outputLabel: 'Sanitized Upstream Payload',
      outputValue: '"Process invoice for client [EMAIL] with card [CREDIT_CARD]"',
      statusBadge: '2 Entities Scrubbed',
    },
  },
  {
    id: 'cache',
    step: '04',
    title: 'Deterministic Cache',
    badge: 'Canonical SHA-256',
    latency: '< 5ms',
    description: 'Normalizes and canonicalizes request payloads to check hot cache. Identical prompts return instantly with 100% token cost elimination.',
    techDetails: 'Tenant-scoped SHA-256 keys prevent cross-customer cache contamination.',
    icon: Zap,
    sampleTransformation: {
      inputLabel: 'Canonical Hash Key',
      inputValue: 'sha256("gpt-4o-mini:user:Summarize invoice #402")',
      outputLabel: 'Cache Hit Status',
      outputValue: 'HTTP 200 OK (5ms latency)\nX-Devv-Cache: HIT (Tokens Saved: 420, Cost: $0.00)',
      statusBadge: '100% Token Cost Saved',
    },
  },
  {
    id: 'router',
    step: '05',
    title: 'Failover Router',
    badge: 'OpenAI ↔ Groq',
    latency: '~120-400ms',
    description: 'If cache misses, forwards sanitized prompt to OpenAI. If OpenAI returns HTTP 429/500, seamlessly reroutes to Groq LLaMA models.',
    techDetails: 'Zero client-side crashes during third-party LLM provider outages.',
    icon: RefreshCw,
    sampleTransformation: {
      inputLabel: 'Primary Provider Health',
      inputValue: 'POST api.openai.com -> HTTP 503 Service Unavailable',
      outputLabel: 'Auto-Failover Circuit',
      outputValue: 'Route to Groq: llama-3.3-70b-versatile (240ms)\nX-Devv-Provider: groq (Failover Active)',
      statusBadge: 'Zero Downtime',
    },
  },
  {
    id: 'telemetry',
    step: '06',
    title: 'Async Telemetry',
    badge: 'PostgreSQL Audit',
    latency: 'Non-blocking',
    description: 'Audit logs, cost savings, tokens processed, and scrubbed entities stream asynchronously via Next.js after() to database.',
    techDetails: 'Database latency never delays client HTTP response cycle.',
    icon: Database,
    sampleTransformation: {
      inputLabel: 'Telemetry Event Captured',
      inputValue: 'tokens: 840, latency_ms: 240, cache_hit: false, pii: 2',
      outputLabel: 'Database Audit Row',
      outputValue: 'INSERT INTO request_logs (key_id, model, status, pii_count) VALUES (...)',
      statusBadge: 'Async Persisted',
    },
  },
];

export function ArchitectureVisualizer() {
  const [activeStageId, setActiveStageId] = useState<string>('pii');
  const activeStage = STAGES.find((s) => s.id === activeStageId) || STAGES[2];
  const ActiveIcon = activeStage.icon;

  return (
    <div className="rounded-xl bg-surface-1 border border-border-subtle p-5 sm:p-8 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-[11px] font-mono text-zinc-400">
            <Cpu className="w-3 h-3 text-primary" />
            <span>Interactive Data Path Visualizer</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight">
            How DevvProxy Intercepts & Shields Your Packets
          </h3>
          <p className="text-xs text-zinc-400 font-sans">
            Click any stage in the pipeline to inspect real-time security transformations, rate limits, and latency characteristics.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Pipeline Operational</span>
        </div>
      </div>

      {/* Responsive Horizontal Pipeline Stages */}
      <div
        role="tablist"
        aria-label="Architecture Pipeline Stages"
        className="flex sm:grid sm:grid-cols-6 gap-2 overflow-x-auto pb-2 sm:pb-0 font-mono text-xs no-scrollbar"
      >
        {STAGES.map((stage) => {
          const Icon = stage.icon;
          const isActive = stage.id === activeStageId;
          return (
            <button
              key={stage.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${stage.id}`}
              id={`tab-${stage.id}`}
              onClick={() => setActiveStageId(stage.id)}
              className={`min-w-[130px] sm:min-w-0 p-3 sm:p-3.5 rounded-lg border text-left transition-all relative flex flex-col justify-between space-y-2.5 min-h-[88px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                isActive
                  ? 'bg-surface-2 border-primary text-white shadow-md ring-1 ring-primary/20'
                  : 'bg-surface-0/60 border-border-subtle text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] text-zinc-500 font-mono">{stage.step}</span>
                <span className={`text-[10px] font-mono ${isActive ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                  {stage.latency}
                </span>
              </div>
              <div className="space-y-0.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-zinc-500'}`} />
                <span className="font-bold block text-xs tracking-tight truncate">{stage.title}</span>
              </div>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Stage Detailed Breakdown Drawer */}
      <div
        role="tabpanel"
        id={`panel-${activeStage.id}`}
        aria-labelledby={`tab-${activeStage.id}`}
        className="rounded-lg bg-surface-editor border border-border-subtle p-5 font-mono text-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle/60 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <ActiveIcon className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm text-white">
              Stage {activeStage.step}: {activeStage.title}
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-[10px] text-zinc-300">
              {activeStage.badge}
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
            <span>Latency overhead:</span>
            <span className="text-emerald-400 font-bold">{activeStage.latency}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-zinc-300 font-sans leading-relaxed text-xs">
          <div>
            <span className="text-[11px] font-mono text-zinc-500 block mb-1 uppercase tracking-wider">
              Function & Purpose
            </span>
            <p>{activeStage.description}</p>
          </div>
          <div>
            <span className="text-[11px] font-mono text-zinc-500 block mb-1 uppercase tracking-wider">
              Architectural Guarantee
            </span>
            <p className="font-mono text-zinc-400 text-[11px]">{activeStage.techDetails}</p>
          </div>
        </div>

        {/* Live Transformation Preview */}
        {activeStage.sampleTransformation && (
          <div className="pt-2 border-t border-border-subtle/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                Live Pipeline State Inspection
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-semibold">
                {activeStage.sampleTransformation.statusBadge}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11px]">
              <div className="p-3 rounded bg-surface-1 border border-border-subtle space-y-1">
                <span className="text-zinc-500 text-[10px] block">
                  {activeStage.sampleTransformation.inputLabel}
                </span>
                <pre className="text-zinc-300 whitespace-pre-wrap overflow-x-auto">
                  <code>{activeStage.sampleTransformation.inputValue}</code>
                </pre>
              </div>
              <div className="p-3 rounded bg-surface-1 border border-primary/30 space-y-1">
                <span className="text-emerald-400 text-[10px] block font-semibold">
                  {activeStage.sampleTransformation.outputLabel}
                </span>
                <pre className="text-zinc-200 whitespace-pre-wrap overflow-x-auto">
                  <code>{activeStage.sampleTransformation.outputValue}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
