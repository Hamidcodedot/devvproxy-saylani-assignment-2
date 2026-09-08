'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  BookOpen,
  Terminal,
  Code2,
  Lock,
  Zap,
  ArrowRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  Github,
} from 'lucide-react';

export default function DocsPage() {
  const [activeSnippetTab, setActiveSnippetTab] = useState<'python' | 'nodejs' | 'curl'>('python');

  return (
    <div className="min-h-screen bg-background text-[#f4f4f5] flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Navigation */}
      <nav className="border-b border-border-subtle bg-surface-0 px-4 sm:px-8 h-16 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded bg-surface-2 border border-border-subtle flex items-center justify-center text-primary">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-sans text-lg font-bold tracking-tight text-white">
            Devv<span className="text-primary">Proxy</span>
          </span>
          <span className="text-xs font-mono text-zinc-500 ml-1">/ docs</span>
        </Link>
        <div className="flex items-center gap-4 text-xs font-mono">
          <Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <a
            href="https://github.com/Hamidcodedot/devvproxy-saylani-assignment-2"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded bg-white hover:bg-zinc-200 text-black font-bold transition-colors"
          >
            Console
          </Link>
        </div>
      </nav>

      {/* Main Documentation Body */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-8 py-12 space-y-12">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-2 border border-border-subtle text-[11px] font-mono text-zinc-400 mb-3">
            <BookOpen className="w-3 h-3 text-primary" />
            Developer Documentation v1.0
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono">
            DevvProxy Integration Guide
          </h1>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed font-sans">
            Learn how to route your LLM traffic through DevvProxy to enforce edge PII sanitization and 0ms deterministic caching with zero application code changes.
          </p>
        </div>

        {/* 1. Quickstart with Multi-Language Snippets */}
        <section className="space-y-4 pt-6 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              1. Zero-Code-Refactor Quickstart
            </h2>
            <div className="flex items-center gap-1 bg-surface-2 p-1 rounded border border-border-subtle text-[11px] font-mono">
              <button
                onClick={() => setActiveSnippetTab('python')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeSnippetTab === 'python' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Python
              </button>
              <button
                onClick={() => setActiveSnippetTab('nodejs')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeSnippetTab === 'nodejs' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Node.js
              </button>
              <button
                onClick={() => setActiveSnippetTab('curl')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeSnippetTab === 'curl' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                cURL
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            DevvProxy implements the exact HTTP wire protocol of the OpenAI Chat Completions API. Point <code className="text-emerald-400 bg-surface-2 px-1 py-0.5 rounded font-mono">base_url</code> to DevvProxy to activate edge PII redaction and deterministic caching:
          </p>

          <div className="rounded-lg bg-surface-editor border border-border-subtle p-4 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
            {activeSnippetTab === 'python' && (
              <div>
                <span className="text-zinc-500"># Python Example using official openai SDK</span><br />
                <span className="text-purple-400">from</span> openai <span className="text-purple-400">import</span> OpenAI<br /><br />
                client = OpenAI(<br />
                &nbsp;&nbsp;base_url=<span className="text-emerald-400">"https://devvproxy.vercel.app/api/v1"</span>, <span className="text-zinc-500"># Point to DevvProxy</span><br />
                &nbsp;&nbsp;api_key=<span className="text-emerald-400">"devv_live_demo_9481b37c"</span> <span className="text-zinc-500"># Or your virtual key</span><br />
                )<br /><br />
                response = client.chat.completions.create(<br />
                &nbsp;&nbsp;model=<span className="text-emerald-400">"gpt-4o-mini"</span>,<br />
                &nbsp;&nbsp;messages=[&#123;<span className="text-emerald-400">"role"</span>: <span className="text-emerald-400">"user"</span>, <span className="text-emerald-400">"content"</span>: <span className="text-emerald-400">"Draft invoice for user@corp.com with card 4532-1188-9922-3344"</span>&#125;]<br />
                )<br />
                <span className="text-purple-400">print</span>(response.choices[0].message.content)
              </div>
            )}

            {activeSnippetTab === 'nodejs' && (
              <div>
                <span className="text-zinc-500">// Node.js / TypeScript Example</span><br />
                <span className="text-purple-400">import</span> OpenAI <span className="text-purple-400">from</span> <span className="text-emerald-400">'openai'</span>;<br /><br />
                <span className="text-purple-400">const</span> client = <span className="text-purple-400">new</span> OpenAI(&#123;<br />
                &nbsp;&nbsp;baseURL: <span className="text-emerald-400">'https://devvproxy.vercel.app/api/v1'</span>,<br />
                &nbsp;&nbsp;apiKey: <span className="text-emerald-400">'devv_live_demo_9481b37c'</span>,<br />
                &#125;);<br /><br />
                <span className="text-purple-400">const</span> completion = <span className="text-purple-400">await</span> client.chat.completions.create(&#123;<br />
                &nbsp;&nbsp;model: <span className="text-emerald-400">'gpt-4o-mini'</span>,<br />
                &nbsp;&nbsp;messages: [&#123; role: <span className="text-emerald-400">'user'</span>, content: <span className="text-emerald-400">'Draft invoice for user@corp.com'</span> &#125;],<br />
                &#125;);<br />
                console.log(completion.choices[0].message.content);
              </div>
            )}

            {activeSnippetTab === 'curl' && (
              <div>
                <span className="text-zinc-500"># Direct cURL Wire Request</span><br />
                curl -X POST https://devvproxy.vercel.app/api/v1/chat/completions \<br />
                &nbsp;&nbsp;-H <span className="text-emerald-400">"Content-Type: application/json"</span> \<br />
                &nbsp;&nbsp;-H <span className="text-emerald-400">"Authorization: Bearer devv_live_demo_9481b37c"</span> \<br />
                &nbsp;&nbsp;-d '<br />
                &nbsp;&nbsp;&#123;<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400">"model"</span>: <span className="text-emerald-400">"gpt-4o-mini"</span>,<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400">"messages"</span>: [&#123;<span className="text-emerald-400">"role"</span>: <span className="text-emerald-400">"user"</span>, <span className="text-emerald-400">"content"</span>: <span className="text-emerald-400">"Hello from DevvProxy"</span>&#125;]<br />
                &nbsp;&nbsp;&#125;'
              </div>
            )}
          </div>
        </section>

        {/* 2. PII Engine Specifications */}
        <section className="space-y-4 pt-6 border-t border-border-subtle">
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            2. ReDoS-Resistant PII Redaction Rules
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            DevvProxy runs a linear-time, non-backtracking redaction engine at the edge before packets are forwarded to upstream LLM providers:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-lg bg-surface-1 border border-border-subtle space-y-1.5">
              <span className="text-white font-bold block">Credit Cards (Luhn Validated)</span>
              <p className="text-zinc-400 text-[11px] font-sans">
                Validates 13–19 digit sequences using the mathematical Luhn checksum algorithm. Non-card digit sequences are preserved safely.
              </p>
              <span className="text-emerald-400 text-[10px] block font-mono">Placeholder: [REDACTED_CREDIT_CARD_N]</span>
            </div>

            <div className="p-4 rounded-lg bg-surface-1 border border-border-subtle space-y-1.5">
              <span className="text-white font-bold block">Email Addresses</span>
              <p className="text-zinc-400 text-[11px] font-sans">
                Linear RFC 5322 compliant regular expression with zero nested quantifiers, resistant to ReDoS attacks.
              </p>
              <span className="text-emerald-400 text-[10px] block font-mono">Placeholder: [REDACTED_EMAIL_N]</span>
            </div>

            <div className="p-4 rounded-lg bg-surface-1 border border-border-subtle space-y-1.5">
              <span className="text-white font-bold block">US Social Security Numbers</span>
              <p className="text-zinc-400 text-[11px] font-sans">
                Matches formatted standard XXX-XX-XXXX patterns with boundary protections and reserved area code filtering.
              </p>
              <span className="text-emerald-400 text-[10px] block font-mono">Placeholder: [REDACTED_SSN_N]</span>
            </div>

            <div className="p-4 rounded-lg bg-surface-1 border border-border-subtle space-y-1.5">
              <span className="text-white font-bold block">API Keys & Cloud Secrets</span>
              <p className="text-zinc-400 text-[11px] font-sans">
                Detects high-entropy keys: OpenAI (<code className="text-zinc-300">sk-...</code>), GitHub tokens (<code className="text-zinc-300">ghp_...</code>), and AWS credentials.
              </p>
              <span className="text-emerald-400 text-[10px] block font-mono">Placeholder: [REDACTED_SECRET_N]</span>
            </div>
          </div>
        </section>

        {/* 3. Deterministic Caching & Headers */}
        <section className="space-y-4 pt-6 border-t border-border-subtle">
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            3. Deterministic Caching & Custom Response Headers
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            DevvProxy inspects response headers on every query. If a request has been processed before by your team, it resolves in under 5ms:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border border-border-subtle rounded-lg">
              <thead className="bg-surface-2 text-zinc-400 border-b border-border-subtle">
                <tr>
                  <th className="py-2.5 px-4">Header</th>
                  <th className="py-2.5 px-4">Values</th>
                  <th className="py-2.5 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-zinc-300">
                <tr>
                  <td className="py-2.5 px-4 text-emerald-400">X-Devv-Cache</td>
                  <td className="py-2.5 px-4">HIT | MISS</td>
                  <td className="py-2.5 px-4 text-zinc-400">Indicates whether response was served from 0ms cache.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-zinc-200">X-Devv-Provider</td>
                  <td className="py-2.5 px-4">cache | openai | groq | simulator</td>
                  <td className="py-2.5 px-4 text-zinc-400">Identifies which upstream engine fulfilled the request.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-white">X-Devv-PII-Scrubbed</td>
                  <td className="py-2.5 px-4">Integer (e.g. 2)</td>
                  <td className="py-2.5 px-4 text-zinc-400">Number of sensitive entities masked at the edge.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Streaming Support: Coming in v1.1 */}
        <section className="space-y-4 pt-6 border-t border-border-subtle">
          <div className="p-5 rounded-xl bg-surface-1 border border-border-subtle space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-border-subtle font-mono text-[10px] flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-primary" />
                Coming in v1.1 (Phase 2)
              </span>
              <h3 className="font-mono text-sm font-bold text-white">
                Server-Sent Events (SSE) Streaming Compatibility
              </h3>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              DevvProxy v1.0 guarantees exact SHA-256 caching and complete prompt PII redaction over non-streaming requests (<code className="text-zinc-300 font-mono">stream: false</code>). Real-time chunked stream de-masking using sliding-window TransformStreams is scheduled for release in v1.1.
            </p>
            <div className="text-xs font-mono text-zinc-500 pt-1">
              Attempting to pass <code className="text-zinc-400">stream: true</code> currently returns HTTP 400 with a roadmap disclosure.
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border-subtle py-8 text-center text-xs font-mono text-zinc-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-8">
          <p>DevvProxy Documentation • Minimalist Architecture • Part of devvkit</p>
          <a
            href="https://github.com/Hamidcodedot/devvproxy-saylani-assignment-2"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <Github className="w-3.5 h-3.5" />
            <span>View Source on GitHub</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
