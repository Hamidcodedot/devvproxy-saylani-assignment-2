'use client';

import React, { useState } from 'react';
import {
  Terminal,
  Shield,
  Zap,
  RefreshCw,
  Database,
  ArrowRight,
  Cpu,
} from 'lucide-react';

interface Stage {
  id: string;
  step: string;
  title: string;
  badge: string;
  latency: string;
  description: string;
  techDetails: string;
  icon: any;
}

const STAGES: Stage[] = [
  {
    id: 'client',
    step: '01',
    title: 'Client Application',
    badge: 'OpenAI SDK / LangChain',
    latency: '0ms',
    description: 'Existing client application makes a standard OpenAI chat completion request by simply pointing base_url to DevvProxy.',
    techDetails: 'Drop-in wire compatibility. Zero refactoring required in application logic.',
    icon: Terminal,
  },
  {
    id: 'pii',
    step: '02',
    title: 'Edge PII Sanitizer',
    badge: 'Luhn + ReDoS Shield',
    latency: '< 2ms',
    description: 'Linear-time regex engine scrubs credit card numbers (validated via Luhn algorithm), SSNs, emails, and secrets before forwarding.',
    techDetails: 'Protects proprietary corporate data from leaking into external model training datasets.',
    icon: Shield,
  },
  {
    id: 'cache',
    step: '03',
    title: 'Deterministic Cache',
    badge: 'Canonical SHA-256',
    latency: '< 5ms',
    description: 'Normalizes and canonicalizes request payloads to check hot cache. Identical prompts return instantly with 100% token cost elimination.',
    techDetails: 'Tenant-scoped SHA-256 keys prevent cross-customer cache contamination.',
    icon: Zap,
  },
  {
    id: 'router',
    step: '04',
    title: 'Failover Router',
    badge: 'OpenAI ↔ Groq',
    latency: '~120-400ms',
    description: 'If cache misses, forwards sanitized prompt to OpenAI. If OpenAI returns HTTP 429/500, seamlessly reroutes to Groq LLaMA models.',
    techDetails: 'Zero client-side crashes during third-party LLM provider outages.',
    icon: RefreshCw,
  },
  {
    id: 'telemetry',
    step: '05',
    title: 'Async Telemetry',
    badge: 'Supabase PostgreSQL',
    latency: 'Non-blocking',
    description: 'Audit logs, cost savings, tokens processed, and scrubbed entities stream asynchronously via Next.js after() to database.',
    techDetails: 'Database latency never delays client HTTP response cycle.',
    icon: Database,
  },
];

export function ArchitectureVisualizer() {
  const [activeStageId, setActiveStageId] = useState<string>('pii');
  const activeStage = STAGES.find((s) => s.id === activeStageId) || STAGES[1];
  const ActiveIcon = activeStage.icon;

  return (
    <div className="rounded-xl bg-surface-1 border border-border-subtle p-6 sm:p-8 space-y-6 shadow-xl">
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
            Click any stage in the pipeline to inspect real-time security transformations and latency characteristics.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Pipeline Operational</span>
        </div>
      </div>

      {/* Horizontal Pipeline Stages */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-xs">
        {STAGES.map((stage) => {
          const Icon = stage.icon;
          const isActive = stage.id === activeStageId;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageId(stage.id)}
              className={`p-3.5 rounded-lg border text-left transition-all relative flex flex-col justify-between space-y-3 ${
                isActive
                  ? 'bg-surface-2 border-primary text-white shadow-lg ring-1 ring-primary/20'
                  : 'bg-surface-0/60 border-border-subtle text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-mono">{stage.step}</span>
                <span className={`text-[10px] font-mono ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {stage.latency}
                </span>
              </div>
              <div className="space-y-1">
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-zinc-500'}`} />
                <span className="font-bold block text-xs tracking-tight">{stage.title}</span>
              </div>
              {isActive && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-primary rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Stage Detailed Breakdown Drawer */}
      <div className="rounded-lg bg-surface-editor border border-border-subtle p-5 font-mono text-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle/60 pb-3">
          <div className="flex items-center gap-2">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-zinc-300 font-sans leading-relaxed text-xs">
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
      </div>
    </div>
  );
}
