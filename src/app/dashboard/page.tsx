'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { MetricCards } from '@/components/MetricCards';
import { SecuritySandbox } from '@/components/SecuritySandbox';
import { TelemetryFeed } from '@/components/TelemetryFeed';
import { QuickStart } from '@/components/QuickStart';
import { KeyManagerModal } from '@/components/KeyManagerModal';
import { DashboardStats, RequestLog, ApiKeyRecord } from '@/types';
import { Shield, LogOut, User as UserIcon, ArrowRight } from 'lucide-react';

const INITIAL_STATS: DashboardStats = {
  totalRequests: 14290,
  totalTokensProcessed: 1840000,
  tokensSavedViaCache: 1280000,
  dollarsSavedTotal: 34.65,
  piiEntitiesRedacted: 412,
  cacheHitRatePct: 68,
  avgCacheLatencyMs: 14,
  avgUpstreamLatencyMs: 415,
  systemStatus: 'operational',
};

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ email: string; name?: string } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [activeKey, setActiveKey] = useState<ApiKeyRecord | null>(null);
  const [activeKeyToken, setActiveKeyToken] = useState<string>('devv_live_demo_9481b37c');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
        } else {
          // If unauthenticated, redirect to login page
          router.push('/login');
          return;
        }
      } catch {
        // Fallback
      } finally {
        setIsAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // Fetch telemetry and keys from backend
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
        if (data.recentLogs) setLogs(data.recentLogs);
        if (data.keys && data.keys.length > 0) {
          setKeys(data.keys);
          if (!activeKey) {
            const defaultKey = data.keys.find((k: ApiKeyRecord) => k.is_active) || data.keys[0];
            setActiveKey(defaultKey);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load telemetry', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeKey]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  const handleSelectKey = (key: ApiKeyRecord) => {
    setActiveKey(key);
    if (key.prefix.includes('demo')) {
      setActiveKeyToken('devv_live_demo_9481b37c');
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-xs font-mono text-zinc-400 gap-3">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span>Verifying secure session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-[#f4f4f5] flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Navbar */}
      <Navbar
        keys={keys}
        activeKey={activeKey}
        onSelectKey={handleSelectKey}
        onOpenKeyManager={() => setIsKeyModalOpen(true)}
        systemStatus={stats.systemStatus}
      />

      {/* User Account Bar */}
      <div className="border-b border-border-subtle bg-surface-1 px-4 sm:px-8 py-2 flex items-center justify-between text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <UserIcon className="w-3.5 h-3.5 text-primary" />
          <span>Signed in as: <strong className="text-white">{currentUser?.email}</strong></span>
          <span className="px-1.5 py-0.2 rounded bg-surface-2 border border-border-subtle text-[10px] text-emerald-400">
            Active Workspace
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="hover:text-white transition-colors">
            Manage Plan
          </Link>
          <span className="text-zinc-700">|</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              Command Center
            </h1>
            <p className="text-xs text-zinc-400 mt-1 font-sans">
              Live edge gateway telemetry, side-by-side security sandbox, and key vault.
            </p>
          </div>
        </div>

        {/* 1. KPI Metric Cards */}
        <section aria-label="System Metrics">
          <MetricCards stats={stats} />
        </section>

        {/* 2. Interactive Live Security & Cache Sandbox */}
        <section aria-label="Interactive Sandbox">
          <SecuritySandbox
            activeKeyToken={activeKeyToken}
            onExecutionComplete={fetchData}
          />
        </section>

        {/* 3. Live Request Telemetry Feed */}
        <section aria-label="Telemetry Feed">
          <TelemetryFeed
            logs={logs}
            onRefresh={fetchData}
            isRefreshing={isRefreshing}
          />
        </section>

        {/* 4. Quick-Start 1-Line Integration Drawer */}
        <section aria-label="Integration Snippets">
          <QuickStart activeKeyToken={activeKeyToken} />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border-subtle bg-surface-0 py-6 px-4 sm:px-8 text-center text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>DevvProxy Edge Gateway v1.0.0</span>
            <span className="text-zinc-700">|</span>
            <span>Minimalist Monochrome Theme</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>

      {/* Virtual Key Manager Modal */}
      <KeyManagerModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        keys={keys}
        onKeyCreated={fetchData}
        onKeyRevoked={fetchData}
        activeKey={activeKey}
        onSelectKey={handleSelectKey}
      />
    </div>
  );
}
