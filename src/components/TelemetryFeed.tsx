'use client';

import React from 'react';
import { Activity, RefreshCw, Zap, Shield, Database } from 'lucide-react';
import { RequestLog } from '@/types';

interface TelemetryFeedProps {
  logs: RequestLog[];
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function TelemetryFeed({
  logs,
  onRefresh,
  isRefreshing = false,
}: TelemetryFeedProps) {
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="rounded-xl bg-surface-1 border border-border-subtle overflow-hidden">
      {/* Table Header */}
      <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-0/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-surface-2 text-primary">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              Live Request Telemetry Feed
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 text-zinc-400">
                PostgreSQL Audit Log
              </span>
            </h3>
            <p className="text-xs text-zinc-400 font-sans">
              Immutable telemetry record of every proxied LLM call
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-zinc-800 text-xs font-mono text-zinc-300 hover:text-white border border-border-subtle transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-surface-0 text-zinc-400 border-b border-border-subtle text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Model</th>
              <th className="py-3 px-4">Provider</th>
              <th className="py-3 px-4">Latency</th>
              <th className="py-3 px-4">PII Scrubbed</th>
              <th className="py-3 px-4">Tokens</th>
              <th className="py-3 px-4">Cost Saved</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/50 text-zinc-300">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-500">
                  No requests recorded yet. Send a test query using the sandbox above!
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-surface-2/40 transition-colors group"
                >
                  {/* Time */}
                  <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                    {formatTime(log.created_at)}
                  </td>

                  {/* Model */}
                  <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                    {log.model}
                  </td>

                  {/* Upstream Provider */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {log.upstream_provider === 'cache' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        <Zap className="w-2.5 h-2.5" />
                        CACHE (0ms)
                      </span>
                    ) : log.upstream_provider === 'groq' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                        GROQ (Failover)
                      </span>
                    ) : log.upstream_provider === 'openai' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px]">
                        OPENAI
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px]">
                        SIMULATOR
                      </span>
                    )}
                  </td>

                  {/* Latency */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        log.latency_ms < 50
                          ? 'text-emerald-400'
                          : log.latency_ms < 500
                          ? 'text-zinc-300'
                          : 'text-amber-400'
                      }`}
                    >
                      {log.latency_ms}ms
                    </span>
                  </td>

                  {/* PII Scrubbed */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {log.pii_scrubbed_count > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                        <Shield className="w-2.5 h-2.5" />
                        {log.pii_scrubbed_count} scrubbed
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-[11px]">Clean</span>
                    )}
                  </td>

                  {/* Tokens */}
                  <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                    {log.total_tokens}
                  </td>

                  {/* Cost Saved */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {log.cost_saved_usd > 0 ? (
                      <span className="text-emerald-400 font-bold">
                        +${log.cost_saved_usd.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-zinc-600">$0.0000</span>
                    )}
                  </td>

                  {/* Status Code */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-2 text-emerald-400 text-[10px] font-mono">
                      {log.cache_hit ? 'HIT 200' : '200 OK'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
