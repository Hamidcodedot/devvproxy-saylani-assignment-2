'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Key, Github, BookOpen, Sparkles, Home } from 'lucide-react';
import { ApiKeyRecord } from '@/types';

interface NavbarProps {
  keys: ApiKeyRecord[];
  activeKey: ApiKeyRecord | null;
  onSelectKey: (key: ApiKeyRecord) => void;
  onOpenKeyManager: () => void;
  systemStatus?: 'operational' | 'degraded' | 'maintenance';
}

export function Navbar({
  keys,
  activeKey,
  onSelectKey,
  onOpenKeyManager,
  systemStatus = 'operational',
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-surface-0 px-4 sm:px-8 h-16 flex items-center justify-between">
      {/* Brand & Ecosystem */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded bg-surface-2 border border-border-subtle flex items-center justify-center text-primary">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-lg font-bold tracking-tight text-white">
              Devv<span className="text-primary">Proxy</span>
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface-2 border border-border-subtle text-[10px] font-mono text-zinc-400">
              devvkit
            </span>
          </div>
        </Link>

        {/* Operational Status Pill */}
        <div className="hidden md:flex items-center gap-2 ml-3 px-2.5 py-1 bg-surface-1 border border-border-subtle rounded text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-zinc-300">Edge Gateway Online</span>
        </div>
      </div>

      {/* Right Controls: Key Selector & External Links */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono text-zinc-400 hover:text-white hover:bg-surface-1 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          Home
        </Link>

        {/* Virtual Key Selector */}
        <button
          onClick={onOpenKeyManager}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-surface-1 border border-border-subtle hover:border-zinc-700 transition-all text-xs font-mono text-zinc-300 hover:text-white"
        >
          <Key className="w-3.5 h-3.5 text-primary" />
          <span className="hidden sm:inline text-zinc-500">Key:</span>
          <span className="font-semibold text-zinc-200">
            {activeKey ? activeKey.prefix : 'devv_live_...'}
          </span>
        </button>

        {/* Docs Link */}
        <Link
          href="/docs"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono text-zinc-400 hover:text-white hover:bg-surface-1 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Docs
        </Link>
      </div>
    </header>
  );
}
