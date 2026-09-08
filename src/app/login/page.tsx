'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Demo login failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-[#f4f4f5] flex flex-col justify-center items-center px-4 sm:px-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-surface-2 border border-border-subtle flex items-center justify-center text-primary">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-sans text-xl font-bold tracking-tight text-white">
              Devv<span className="text-primary">Proxy</span>
            </span>
          </Link>
          <p className="text-xs text-zinc-400 font-sans">
            Sign in to access your private edge gateway & API keys
          </p>
        </div>

        {/* 1-Click Evaluator Demo Mode Box */}
        <div className="p-4 rounded-lg bg-surface-1 border border-primary/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
            <span className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Course Evaluator Mode
            </span>
            <span className="text-[10px] text-zinc-500">Zero Setup</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Testing for grading or quick evaluation? Skip manual registration:
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isDemoLoading}
            className="w-full py-2 px-3 rounded bg-surface-2 hover:bg-zinc-800 text-white border border-primary/40 font-mono text-xs font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isDemoLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>1-Click Instant Demo Login</span>
                <ArrowRight className="w-3 h-3 text-primary" />
              </>
            )}
          </button>
        </div>

        {/* Standard Login Form */}
        <div className="p-6 rounded-lg bg-surface-1 border border-border-subtle space-y-4">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Standard Sign In
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/40 text-rose-400 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.com"
                className="w-full px-3 py-2 rounded bg-surface-2 border border-border-subtle text-xs text-white font-mono placeholder-zinc-600 focus:border-zinc-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-mono text-zinc-400">Password</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded bg-surface-2 border border-border-subtle text-xs text-white font-mono placeholder-zinc-600 focus:border-zinc-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-3 rounded bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold transition-all disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-border-subtle">
            <span className="text-xs text-zinc-500 font-sans">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-mono">
                Create one
              </Link>
            </span>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 font-mono">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
