'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, Sparkles } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
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
            Create a developer account to manage your private AI proxies
          </p>
        </div>

        {/* Signup Form */}
        <div className="p-6 rounded-lg bg-surface-1 border border-border-subtle space-y-4">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Register Account
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/40 text-rose-400 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Full Name / Organization
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full px-3 py-2 rounded bg-surface-2 border border-border-subtle text-xs text-white font-mono placeholder-zinc-600 focus:border-zinc-500"
              />
            </div>

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
              <label className="block text-xs font-mono text-zinc-400 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 rounded bg-surface-2 border border-border-subtle text-xs text-white font-mono placeholder-zinc-600 focus:border-zinc-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-3 rounded bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold transition-all disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-border-subtle">
            <span className="text-xs text-zinc-500 font-sans">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-mono">
                Sign In
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
