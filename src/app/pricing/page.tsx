'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Check, ArrowRight, Zap, Calculator, Sparkles } from 'lucide-react';
import { PLANS } from '@/lib/billing/adapter';
import { PlanTier } from '@/lib/billing/types';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [monthlySpend, setMonthlySpend] = useState<number>(500);
  const [isLoadingPlan, setIsLoadingPlan] = useState<PlanTier | null>(null);

  // ROI Calculator formula: Average 42% cache hit on repetitive queries
  const estimatedSavings = Math.round(monthlySpend * 0.42);
  const annualSavings = estimatedSavings * 12;

  const handleSelectPlan = async (planId: PlanTier) => {
    setIsLoadingPlan(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (res.status === 401) {
        window.location.href = `/login?redirect=/pricing`;
        return;
      }

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error('Checkout error', err);
    } finally {
      setIsLoadingPlan(null);
    }
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
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* 1. Hobby */}
          <div className="p-6 rounded-lg bg-surface-1 border border-border-subtle flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  {PLANS.hobby.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">{PLANS.hobby.description}</p>
              </div>

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

            <button
              onClick={() => handleSelectPlan('hobby')}
              disabled={isLoadingPlan === 'hobby'}
              className="w-full py-2 px-3 rounded bg-surface-2 hover:bg-zinc-800 text-white border border-border-subtle text-xs font-mono font-medium transition-colors"
            >
              Get Started Free
            </button>
          </div>

          {/* 2. Pro (Featured) */}
          <div className="p-6 rounded-lg bg-surface-1 border border-primary/50 relative flex flex-col justify-between space-y-6 shadow-xl">
            <div className="absolute -top-3 right-6 px-2 py-0.5 rounded bg-primary text-black font-mono text-[10px] font-bold uppercase tracking-wider">
              Most Popular
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  {PLANS.pro.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">{PLANS.pro.description}</p>
              </div>

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
              onClick={() => handleSelectPlan('pro')}
              disabled={isLoadingPlan === 'pro'}
              className="w-full py-2 px-3 rounded bg-white hover:bg-zinc-200 text-black text-xs font-mono font-bold transition-all"
            >
              {isLoadingPlan === 'pro' ? 'Redirecting to Checkout...' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* 3. Enterprise */}
          <div className="p-6 rounded-lg bg-surface-1 border border-border-subtle flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  {PLANS.enterprise.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">{PLANS.enterprise.description}</p>
              </div>

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

            <button
              onClick={() => handleSelectPlan('enterprise')}
              disabled={isLoadingPlan === 'enterprise'}
              className="w-full py-2 px-3 rounded bg-surface-2 hover:bg-zinc-800 text-white border border-border-subtle text-xs font-mono font-medium transition-colors"
            >
              Contact Enterprise
            </button>
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
    </div>
  );
}
