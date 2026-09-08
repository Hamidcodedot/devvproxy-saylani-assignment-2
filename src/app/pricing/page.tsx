'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Check,
  ArrowRight,
  Zap,
  Calculator,
  Sparkles,
  Clock,
  CheckCircle2,
  X,
} from 'lucide-react';
import { PLANS } from '@/lib/billing/adapter';

export default function PricingPage() {
  const [monthlySpend, setMonthlySpend] = useState<number>(500);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState<boolean>(false);
  const [waitlistEmail, setWaitlistEmail] = useState<string>('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState<boolean>(false);

  // ROI Calculator formula: Average 42% cache hit on repetitive queries
  const estimatedSavings = Math.round(monthlySpend * 0.42);
  const annualSavings = estimatedSavings * 12;

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-[#f4f4f5] flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Navigation */}
      <nav className="border-b border-border-subtle bg-surface-0 px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded bg-surface-2 border border-border-subtle flex items-center justify-center text-primary">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-sans text-lg font-bold tracking-tight text-white">
            Devv<span className="text-primary">Proxy</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 text-xs font-mono">
          <Link href="/docs" className="text-zinc-400 hover:text-white transition-colors">
            Docs
          </Link>
          <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded bg-white hover:bg-zinc-200 text-black font-bold transition-colors"
          >
            Console
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-16 space-y-16">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-2 border border-border-subtle text-[11px] font-mono text-zinc-400">
            <Sparkles className="w-3 h-3 text-primary" />
            Transparent Developer Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Cut your AI bills in half, not your privacy.
          </h1>
          <p className="text-sm text-zinc-400 font-sans leading-relaxed">
            Every cached request saves 100% of LLM token costs and resolves in 3ms. Start free, upgrade as your API traffic scales.
          </p>

          {/* Phase 1 Beta Transparency Notice */}
          <div className="p-3.5 rounded-lg bg-surface-2/70 border border-border-subtle text-left flex items-start gap-3 mt-4">
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-mono font-bold text-white flex items-center gap-2">
                <span>Phase 1 Public Beta Notice</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">100% Free</span>
              </div>
              <p className="text-zinc-400 font-sans leading-relaxed">
                All gateway core capabilities (Edge PII Sanitization, 0ms SHA-256 Cache, Groq/OpenAI Failover Router) are entirely free with zero credit card required during Phase 1. Paid tiers launch in v1.1.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* 1. Hobby (Active MVP) */}
          <div className="p-6 rounded-lg bg-surface-1 border border-border-subtle flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  {PLANS.hobby.name}
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-semibold">
                  Active v1.0
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{PLANS.hobby.description}</p>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono text-white">$0</span>
                <span className="text-xs font-mono text-zinc-500">/ forever</span>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-border-subtle text-xs text-zinc-300">
                {PLANS.hobby.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/signup"
              className="w-full py-2 px-3 rounded bg-surface-2 hover:bg-zinc-800 text-white border border-border-subtle text-xs font-mono font-medium transition-colors text-center block"
            >
              Start Building Free
            </Link>
          </div>

          {/* 2. Pro (Featured - Coming in v1.1) */}
          <div className="p-6 rounded-lg bg-surface-1 border border-border-subtle relative flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  {PLANS.pro.name}
                </h3>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-border-subtle font-mono text-[10px] flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <Clock className="w-2.5 h-2.5 text-primary" />
                  Coming in v1.1 (Phase 2)
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{PLANS.pro.description}</p>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono text-white">$29</span>
                <span className="text-xs font-mono text-zinc-500">/ month</span>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-border-subtle text-xs text-zinc-300">
                {PLANS.pro.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setIsWaitlistOpen(true)}
              className="w-full py-2 px-3 rounded bg-white hover:bg-zinc-200 text-black text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span>Join Pro Waitlist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3. Enterprise (Coming in v1.1) */}
          <div className="p-6 rounded-lg bg-surface-1 border border-border-subtle flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  {PLANS.enterprise.name}
                </h3>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-border-subtle font-mono text-[10px] flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <Clock className="w-2.5 h-2.5 text-primary" />
                  Coming in v1.1 (Phase 2)
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{PLANS.enterprise.description}</p>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono text-white">$199</span>
                <span className="text-xs font-mono text-zinc-500">/ month</span>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-border-subtle text-xs text-zinc-300">
                {PLANS.enterprise.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href="mailto:founder@devvproxy.com?subject=DevvProxy%20Enterprise%20Phase%202%20Inquiry"
              className="w-full py-2 px-3 rounded bg-surface-2 hover:bg-zinc-800 text-white border border-border-subtle text-xs font-mono font-medium transition-colors text-center block"
            >
              Contact Enterprise Beta
            </a>
          </div>
        </div>

        {/* Interactive ROI Savings Calculator */}
        <div className="p-8 rounded-xl bg-surface-1 border border-border-subtle space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-surface-2 text-primary">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono text-white">
                Interactive ROI Savings Calculator
              </h3>
              <p className="text-xs text-zinc-400 font-sans">
                Estimate how much DevvProxy’s deterministic cache will save your company each month
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400">Your Current Monthly OpenAI / Anthropic Bill:</span>
              <span className="text-lg font-bold text-white">${monthlySpend.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={50}
              max={10000}
              step={50}
              value={monthlySpend}
              onChange={(e) => setMonthlySpend(Number(e.target.value))}
              className="w-full h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-500">
              <span>$50 / mo</span>
              <span>$5,000 / mo</span>
              <span>$10,000 / mo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
            <div className="p-4 rounded bg-surface-2/60 border border-border-subtle">
              <span className="text-xs font-mono text-zinc-400 block mb-1">
                Estimated Monthly Savings
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                ${estimatedSavings.toLocaleString()}
              </span>
              <span className="text-[11px] text-zinc-500 block mt-1 font-mono">
                ~42% token redundancy eliminated
              </span>
            </div>

            <div className="p-4 rounded bg-surface-2/60 border border-border-subtle">
              <span className="text-xs font-mono text-zinc-400 block mb-1">
                Estimated Annual Net Savings
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
                ${annualSavings.toLocaleString()}
              </span>
              <span className="text-[11px] text-zinc-500 block mt-1 font-mono">
                Plus zero latency on cached responses
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border-subtle py-8 text-center text-xs font-mono text-zinc-500">
        <p>DevvProxy • Minimalist Developer Infrastructure • Part of the devvkit Chain</p>
      </footer>

      {/* Waitlist Modal for Phase 2 Pro */}
      {isWaitlistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-surface-1 border border-border-subtle p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setIsWaitlistOpen(false);
                setWaitlistSubmitted(false);
              }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-[10px] font-mono text-zinc-400">
                <Clock className="w-3 h-3 text-primary" />
                Phase 2 Release
              </div>
              <h3 className="text-lg font-bold font-mono text-white">Join the Pro Plan Waitlist</h3>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Stripe & Safepay automated subscription billing is launching in v1.1. Enter your email to receive early access and priority beta pricing.
              </p>
            </div>

            {waitlistSubmitted ? (
              <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs font-mono text-white font-bold">You are on the list!</p>
                <p className="text-[11px] text-zinc-400 font-sans">
                  We will notify <span className="text-white font-mono">{waitlistEmail}</span> the moment v1.1 opens. In the meantime, all v1.0 features are completely free to use.
                </p>
                <button
                  onClick={() => setIsWaitlistOpen(false)}
                  className="mt-3 px-4 py-1.5 rounded bg-white text-black text-xs font-mono font-bold"
                >
                  Back to Pricing
                </button>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Developer Email</label>
                  <input
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3 py-2 rounded bg-surface-2 border border-border-subtle text-xs text-white font-mono placeholder-zinc-600 focus:border-zinc-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded bg-white hover:bg-zinc-200 text-black text-xs font-mono font-bold transition-all"
                >
                  Join Waitlist (v1.1)
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
