'use client';

import React from 'react';
import { Activity, Zap, ShieldCheck, Clock, ArrowUpRight, DollarSign } from 'lucide-react';
import { DashboardStats } from '@/types';

interface MetricCardsProps {
  stats: DashboardStats;
}

function formatTokens(tokens: number): string {
  if (!tokens || tokens === 0) return '0';
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return tokens.toLocaleString();
}

export function MetricCards({ stats }: MetricCardsProps) {
  const latencyReduction =
    stats.avgUpstreamLatencyMs > 0 && stats.avgCacheLatencyMs > 0
      ? Math.max(0, Math.round(((stats.avgUpstreamLatencyMs - stats.avgCacheLatencyMs) / stats.avgUpstreamLatencyMs) * 100))
      : (stats.cacheHitRatePct > 0 ? 95 : 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Requests */}
      <div className="p-5 rounded-lg bg-surface-1 border border-border-subtle hover:border-zinc-700 transition-all">
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-mono font-medium tracking-wider uppercase">
            Total Requests
          </span>
          <div className="p-1.5 rounded-md bg-surface-2 text-primary">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
            {stats.totalRequests.toLocaleString()}
          </span>
          {stats.totalRequests > 0 ? (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live
              <ArrowUpRight className="w-3 h-3" />
            </span>
          ) : (
            <span className="text-xs font-mono text-zinc-500">
              Ready
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-zinc-500 font-mono">
          {stats.totalRequests > 0 ? 'Global edge traffic routed' : 'Awaiting incoming requests'}
        </p>
      </div>

      {/* 2. Tokens & Cost Saved via Cache */}
      <div className="p-5 rounded-lg bg-surface-1 border border-border-subtle hover:border-emerald-500/30 transition-all">
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-mono font-medium tracking-wider uppercase text-emerald-400">
            Tokens Saved (0ms Cache)
          </span>
          <div className="p-1.5 rounded-md bg-surface-2 text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
            {formatTokens(stats.tokensSavedViaCache)}
          </span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            ${stats.dollarsSavedTotal.toFixed(2)} Saved
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-500 font-mono">
          {stats.totalRequests > 0 ? `${stats.cacheHitRatePct}% deterministic hit rate` : 'Deterministic semantic cache active'}
        </p>
      </div>

      {/* 3. PII Entities Redacted */}
      <div className="p-5 rounded-lg bg-surface-1 border border-border-subtle hover:border-zinc-700 transition-all">
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-mono font-medium tracking-wider uppercase text-zinc-300">
            PII Entities Scrubbed
          </span>
          <div className="p-1.5 rounded-md bg-surface-2 text-zinc-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
            {stats.piiEntitiesRedacted.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-zinc-500">items</span>
        </div>
        <p className="mt-2 text-xs text-zinc-500 font-mono">
          Cards (Luhn), SSNs, Emails, Keys
        </p>
      </div>

      {/* 4. Gateway Latency Benchmark */}
      <div className="p-5 rounded-lg bg-surface-1 border border-border-subtle hover:border-zinc-700 transition-all">
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-mono font-medium tracking-wider uppercase">
            Avg Latency
          </span>
          <div className="p-1.5 rounded-md bg-surface-2 text-zinc-300">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <div>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {stats.avgCacheLatencyMs}ms
            </span>
            <span className="text-[10px] font-mono text-zinc-400 block">Cache</span>
          </div>
          <span className="text-zinc-600 font-mono">/</span>
          <div>
            <span className="text-2xl font-bold font-mono text-zinc-300">
              {stats.avgUpstreamLatencyMs}ms
            </span>
            <span className="text-[10px] font-mono text-zinc-400 block">Upstream</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500 font-mono">
          {latencyReduction > 0 ? `${latencyReduction}% latency reduction on cache` : 'Sub-millisecond L1 cache ready'}
        </p>
      </div>
    </div>
  );
}
