'use client';

import React, { useState, useRef } from 'react';
import {
  ShieldAlert,
  Zap,
  Send,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Lock,
  ArrowRight,
  Cpu,
  Radio,
} from 'lucide-react';
import { ChatCompletionResponse } from '@/types';

interface SecuritySandboxProps {
  activeKeyToken: string;
  onExecutionComplete?: () => void;
}

const PRESET_PROMPTS = {
  card_email: `Hi, I am Sarah Jenkins (Director of Ops). 
Please process a priority invoice for our client at sarah.jenkins@fintech-corp.com. 
The corporate credit card on file is 4532-1188-9922-3344 (expires 11/28). 
Confirm when done.`,

  agent_loop: `[CrewAI ReAct Agent Loop: Step #4]
Agent Role: Autonomous Web Scraper & Market Researcher
Task: Scrape dynamic DOM elements matching table#customer-orders
Execution Context: Iteration 4 of unbounded recursion. Tool output: []
Action: Re-query identical prompt with temperature=0.0.
[Simulating Agent Runaway Loop Safeguard]`,

  ssn_phone: `Patient Intake Record:
Patient Name: David Miller
Direct Phone: +1 (555) 382-9912
Social Security Number: 123-45-6789
Please generate a summary of treatment consent terms.`,

  api_key: `Debugging internal webhook error:
Our production Stripe secret key sk-live_94819a82bb381c900e1234567890abcdef is throwing a 401 error.
Here is the error log from server ip 192.168.1.1: unauthorized.
Please explain why the key failed.`,
};

export function SecuritySandbox({
  activeKeyToken,
  onExecutionComplete,
}: SecuritySandboxProps) {
  const [prompt, setPrompt] = useState<string>(PRESET_PROMPTS.card_email);
  const [model, setModel] = useState<string>('gpt-4o-mini');
  const [simulateOutage, setSimulateOutage] = useState<boolean>(false);
  const [isStreamingEnabled, setIsStreamingEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAgentBursting, setIsAgentBursting] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<ChatCompletionResponse | null>(null);
  const [lastRawPromptSent, setLastRawPromptSent] = useState<string>('');
  const [streamingText, setStreamingText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [executionStopwatch, setExecutionStopwatch] = useState<number>(0);
  const [isSpamming, setIsSpamming] = useState<boolean>(false);
  const [circuitBreakerResult, setCircuitBreakerResult] = useState<{
    tripped: boolean;
    loopCount: number;
    costSaved: string;
    detail: string;
  } | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: string;
    limit: string;
    reset: string;
  } | null>(null);

  const handleTestRateLimit = async () => {
    if (isLoading || isSpamming) return;
    setIsSpamming(true);
    setErrorMsg(null);

    try {
      for (let i = 1; i <= 6; i++) {
        const res = await fetch('/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeKeyToken}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: `Rate limit burst #${i}` }],
          }),
        });

        const limitHeader = res.headers.get('x-ratelimit-limit-requests');
        const remainingHeader = res.headers.get('x-ratelimit-remaining-requests');
        const resetHeader = res.headers.get('x-ratelimit-reset-requests');

        if (limitHeader && remainingHeader) {
          setRateLimitInfo({
            limit: limitHeader,
            remaining: remainingHeader,
            reset: resetHeader || '60',
          });
        }

        if (res.status === 429) {
          const errData = await res.json().catch(() => ({}));
          const retryAfter = res.headers.get('retry-after') || '15';
          setErrorMsg(
            `Rate Limit Throttled (HTTP 429): ${
              errData?.error?.message || 'Quota exceeded'
            }. Retry-After: ${retryAfter}s.`
          );
          break;
        } else if (res.ok) {
          const data = await res.json();
          setLastResponse(data);
        }
      }
      onExecutionComplete?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Rate limit test failed');
    } finally {
      setIsSpamming(false);
    }
  };

  const handleTestAgentCircuitBreaker = async () => {
    if (isLoading || isSpamming || isAgentBursting) return;
    setIsAgentBursting(true);
    setErrorMsg(null);
    setCircuitBreakerResult(null);

    const loopPrompt = [
      { role: 'system', content: 'You are an autonomous web scraper agent.' },
      { role: 'user', content: 'Parse DOM elements from table #customer-orders' },
    ];

    try {
      for (let i = 1; i <= 5; i++) {
        const res = await fetch('/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeKeyToken}`,
            'X-Devv-Max-Loops': '4',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: loopPrompt,
          }),
        });

        const cbHeader = res.headers.get('x-devv-circuit-breaker');
        const countHeader = res.headers.get('x-devv-loop-count');
        const savedHeader = res.headers.get('x-devv-cost-saved');

        if (res.status === 429 && cbHeader === 'TRIPPED') {
          const errData = await res.json().catch(() => ({}));
          setCircuitBreakerResult({
            tripped: true,
            loopCount: parseInt(countHeader || '4', 10),
            costSaved: savedHeader || '$0.16',
            detail:
              errData?.detail ||
              errData?.error?.message ||
              'Autonomous agent recursive runaway loop intercepted by DevvProxy. Execution halted.',
          });
          break;
        } else if (res.ok) {
          const data = await res.json();
          setLastResponse(data);
        }
      }
      onExecutionComplete?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Agent circuit breaker test failed');
    } finally {
      setIsAgentBursting(false);
    }
  };

  const handleSend = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    setCircuitBreakerResult(null);
    setStreamingText('');
    const start = Date.now();

    const interval = setInterval(() => {
      setExecutionStopwatch(Date.now() - start);
    }, 15);

    try {
      setLastRawPromptSent(prompt);

      const res = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeKeyToken}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          simulate_outage: simulateOutage,
          stream: isStreamingEnabled,
        }),
      });

      clearInterval(interval);
      setExecutionStopwatch(Date.now() - start);

      const limitHeader = res.headers.get('x-ratelimit-limit-requests');
      const remainingHeader = res.headers.get('x-ratelimit-remaining-requests');
      const resetHeader = res.headers.get('x-ratelimit-reset-requests');

      if (limitHeader && remainingHeader) {
        setRateLimitInfo({
          limit: limitHeader,
          remaining: remainingHeader,
          reset: resetHeader || '60',
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 429) {
          const cbHeader = res.headers.get('x-devv-circuit-breaker');
          if (cbHeader === 'TRIPPED') {
            setCircuitBreakerResult({
              tripped: true,
              loopCount: parseInt(res.headers.get('x-devv-loop-count') || '10', 10),
              costSaved: res.headers.get('x-devv-cost-saved') || '$0.16',
              detail: errJson?.detail || 'Agent recursive loop tripped circuit breaker.',
            });
            return;
          }
          const retryAfter = res.headers.get('retry-after') || '15';
          throw new Error(
            `Rate Limit Throttled (HTTP 429): ${errJson?.error?.message || 'Quota exceeded'}. Retry-After: ${retryAfter}s.`
          );
        }
        throw new Error(errJson?.error?.message || `HTTP ${res.status}`);
      }

      if (isStreamingEnabled && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        const isCacheHit = res.headers.get('x-devv-cache') === 'HIT';
        const piiScrubbed = parseInt(res.headers.get('x-devv-pii-scrubbed') || '0', 10);
        const provider = (res.headers.get('x-devv-provider') || 'openai') as any;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkText = decoder.decode(value, { stream: true });
          const lines = chunkText.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                accumulated += delta;
                setStreamingText(accumulated);
              }
            } catch {
              // ignore json parse fragment
            }
          }
        }

        setLastResponse({
          id: `chatcmpl-stream-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model,
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: accumulated },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: Math.round(prompt.length / 4),
            completion_tokens: Math.round(accumulated.length / 4),
            total_tokens: Math.round((prompt.length + accumulated.length) / 4),
          },
          _devv: {
            cache_hit: isCacheHit,
            provider,
            pii_scrubbed_count: piiScrubbed,
            pii_types: piiScrubbed > 0 ? ['CREDIT_CARD', 'EMAIL'] : [],
            latency_ms: Date.now() - start,
            cost_saved_usd: isCacheHit ? 0.0032 : 0,
          },
        });
      } else {
        const data: ChatCompletionResponse = await res.json();
        setLastResponse(data);
      }

      onExecutionComplete?.();
    } catch (err: any) {
      clearInterval(interval);
      setErrorMsg(err.message || 'Failed to dispatch proxy request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-surface-1 border border-border-subtle overflow-hidden">
      {/* Sandbox Header */}
      <div className="px-5 py-4 border-b border-border-subtle flex flex-wrap items-center justify-between gap-4 bg-surface-0/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-primary-container text-primary">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              Live Security & Cache Sandbox
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-normal">
                Edge In-Memory Redactor
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-sans">
              Test real-time PII stripping and 0ms cache hits side-by-side
            </p>
          </div>
        </div>

        {/* Model Selector & Preset Quick-Fill */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-400 font-mono hidden sm:inline">Model:</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="px-2.5 py-1 text-xs font-mono rounded bg-surface-2 border border-border-subtle text-white focus:outline-none focus:border-primary"
          >
            <option value="gpt-4o-mini">gpt-4o-mini (OpenAI / Auto)</option>
            <option value="groq/compound-mini">groq/compound-mini (Groq High-Speed)</option>
            <option value="qwen/qwen3.6-27b">qwen/qwen3.6-27b (Groq Open-Weights)</option>
            <option value="gpt-4o">gpt-4o (Frontier)</option>
          </select>
        </div>
      </div>

      {/* Preset Quick Fill Bar */}
      <div className="px-5 py-2.5 bg-surface-0/40 border-b border-border-subtle flex items-center gap-2 overflow-x-auto text-xs font-mono">
        <span className="text-zinc-500 shrink-0">Sample PII Payloads:</span>
        <button
          onClick={() => setPrompt(PRESET_PROMPTS.card_email)}
          className="px-2.5 py-1 rounded bg-surface-2 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-border-subtle transition-colors shrink-0 flex items-center gap-1.5"
        >
          <ShieldAlert className="w-3 h-3 text-zinc-400" />
          Credit Card & Email
        </button>
        <button
          onClick={() => setPrompt(PRESET_PROMPTS.agent_loop)}
          className="px-2.5 py-1 rounded bg-surface-2 hover:bg-zinc-800 text-emerald-400 hover:text-white border border-emerald-500/30 transition-colors shrink-0 flex items-center gap-1.5 font-semibold"
        >
          <Cpu className="w-3 h-3 text-emerald-400" />
          Agent Runaway Loop
        </button>
        <button
          onClick={() => setPrompt(PRESET_PROMPTS.ssn_phone)}
          className="px-2.5 py-1 rounded bg-surface-2 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-border-subtle transition-colors shrink-0 flex items-center gap-1.5"
        >
          <ShieldAlert className="w-3 h-3 text-zinc-400" />
          SSN & Phone Number
        </button>
        <button
          onClick={() => setPrompt(PRESET_PROMPTS.api_key)}
          className="px-2.5 py-1 rounded bg-surface-2 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-border-subtle transition-colors shrink-0 flex items-center gap-1.5"
        >
          <ShieldAlert className="w-3 h-3 text-zinc-400" />
          Leaked API Key
        </button>
      </div>

      {/* Main Split-Screen Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border-subtle min-h-[380px]">
        {/* Left: Raw Client Request */}
        <div className="p-5 flex flex-col justify-between bg-surface-editor">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                RAW CLIENT REQUEST PAYLOAD
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                {prompt.length} chars
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt with sensitive PII (credit cards, emails, SSNs)..."
              rows={12}
              className="w-full bg-transparent font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>Sent via: Authorization: Bearer devv_live_...</span>
            <button
              onClick={() => setPrompt('')}
              className="hover:text-zinc-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Right: Edge Sanitized Output & LLM Response */}
        <div className="p-5 flex flex-col justify-between bg-surface-0">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                EDGE-SANITIZED & UPSTREAM RESPONSE
              </span>
              {lastResponse?._devv && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    lastResponse._devv.cache_hit
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  {lastResponse._devv.cache_hit ? '0ms CACHE HIT' : 'CACHE MISS'}
                </span>
              )}
            </div>

            {/* Response Display Box */}
            <div className="bg-surface-editor border border-border-subtle rounded-lg p-4 font-mono text-xs min-h-[260px] max-h-[320px] overflow-y-auto leading-relaxed">
              {circuitBreakerResult ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span className="font-bold text-rose-400 text-xs tracking-tight">
                          AUTONOMOUS AGENT CIRCUIT BREAKER TRIPPED (HTTP 429)
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                        CIRCUIT OPEN
                      </span>
                    </div>
                    <p className="text-zinc-300 text-xs font-sans leading-relaxed">
                      {circuitBreakerResult.detail}
                    </p>
                    <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span>Loop Iteration Threshold: <strong className="text-white">{circuitBreakerResult.loopCount} Identical Calls</strong></span>
                      <span className="text-emerald-400 font-bold">Estimated Cost Saved: {circuitBreakerResult.costSaved}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 italic">
                    DevvProxy halted execution at the edge. Upstream LLM provider was never called for subsequent loops, saving budget and API quota.
                  </p>
                </div>
              ) : isLoading && streamingText ? (
                <div className="space-y-2 text-zinc-200">
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1.5 border-b border-border-subtle/50 pb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>STREAMING SSE CHUNKS IN REAL-TIME ({executionStopwatch}ms)</span>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {streamingText}
                    <span className="inline-block w-1.5 h-3 bg-emerald-400 ml-0.5 animate-pulse" />
                  </div>
                </div>
              ) : isLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-zinc-400 gap-3">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-mono text-primary">
                    Intercepting & Redacting PII at Edge ({executionStopwatch}ms)...
                  </span>
                </div>
              ) : errorMsg ? (
                <div className="text-rose-400 p-3 rounded bg-rose-500/10 border border-rose-500/20 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Execution Failed</p>
                    <p className="text-xs mt-1 opacity-90">{errorMsg}</p>
                  </div>
                </div>
              ) : lastResponse ? (
                <div className="space-y-3 text-zinc-300">
                  {/* PII Summary Badge Bar */}
                  {lastResponse._devv && lastResponse._devv.pii_scrubbed_count > 0 && (
                    <div className="p-2.5 rounded bg-surface-2 border border-border-subtle text-zinc-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          <strong className="text-white">{lastResponse._devv.pii_scrubbed_count} PII entity(s)</strong> safely masked before forwarding to LLM
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {lastResponse._devv.pii_types.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded bg-surface-1 border border-border-subtle text-[10px] text-zinc-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assistant Completion Content */}
                  <div className="whitespace-pre-wrap text-zinc-200">
                    {lastResponse.choices[0]?.message?.content}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-12 text-zinc-500 text-center">
                  <Sparkles className="w-8 h-8 text-zinc-700 mb-2" />
                  <p>Click "Send via DevvProxy" below to trigger the live security firewall.</p>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    Send the same query twice to experience the instant 0ms Cache Hit!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Telemetry Chips Bar */}
          {lastResponse?._devv && (
            <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-zinc-400">
                  Latency: <strong className="text-white">{lastResponse._devv.latency_ms}ms</strong>
                </span>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-400">
                  Provider: <strong className="text-emerald-400 uppercase">{lastResponse._devv.provider}</strong>
                </span>
                {rateLimitInfo && (
                  <>
                    <span className="text-zinc-600">|</span>
                    <span className="text-zinc-400">
                      Rate Limit: <strong className="text-emerald-400">{rateLimitInfo.remaining}/{rateLimitInfo.limit} RPM</strong>
                    </span>
                  </>
                )}
              </div>
              <div className="text-emerald-400 font-semibold">
                {lastResponse._devv.cache_hit
                  ? `Saved $${lastResponse._devv.cost_saved_usd.toFixed(4)} & 100% Tokens`
                  : `Used ${lastResponse.usage?.total_tokens || 0} tokens`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="px-5 py-3.5 bg-surface-0 border-t border-border-subtle flex flex-wrap items-center justify-between gap-4">
        {/* Outage, Streaming & Burst Simulation Buttons */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={simulateOutage}
              onChange={(e) => setSimulateOutage(e.target.checked)}
              className="w-4 h-4 rounded bg-surface-2 border-border-subtle text-primary focus:ring-primary focus:ring-offset-surface-0 cursor-pointer"
            />
            <span className="text-xs font-mono text-zinc-300">
              Outage Failover
            </span>
            {simulateOutage && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Active
              </span>
            )}
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isStreamingEnabled}
              onChange={(e) => setIsStreamingEnabled(e.target.checked)}
              className="w-4 h-4 rounded bg-surface-2 border-border-subtle text-emerald-400 focus:ring-emerald-400 cursor-pointer"
            />
            <span className="text-xs font-mono text-zinc-300 flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>SSE Stream</span>
            </span>
            {isStreamingEnabled && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Live
              </span>
            )}
          </label>

          <button
            onClick={handleTestRateLimit}
            disabled={isLoading || isSpamming || isAgentBursting}
            className="px-2.5 py-1 rounded bg-surface-2 hover:bg-zinc-800 border border-border-subtle text-xs font-mono text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-[0.97]"
            title="Fires rapid burst requests to test HTTP 429 rate limit enforcement"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${isSpamming ? 'animate-pulse' : ''}`} />
            <span>{isSpamming ? 'Bursting...' : 'Test Rate Limit'}</span>
          </button>

          <button
            onClick={handleTestAgentCircuitBreaker}
            disabled={isLoading || isSpamming || isAgentBursting}
            className="px-2.5 py-1 rounded bg-surface-2 hover:bg-zinc-800 border border-rose-500/30 text-xs font-mono text-rose-300 hover:text-white transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-[0.97]"
            title="Simulates rapid identical calls to trip the Autonomous Agent Circuit Breaker"
          >
            <Cpu className={`w-3.5 h-3.5 text-rose-400 ${isAgentBursting ? 'animate-pulse' : ''}`} />
            <span>{isAgentBursting ? 'Testing Loops...' : 'Simulate Agent Loop'}</span>
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSend}
          disabled={isLoading || isSpamming || isAgentBursting || !prompt.trim()}
          className="flex items-center gap-2 px-5 py-2 rounded-md bg-primary hover:bg-primary-bright text-black font-mono font-bold text-xs hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Send via DevvProxy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
