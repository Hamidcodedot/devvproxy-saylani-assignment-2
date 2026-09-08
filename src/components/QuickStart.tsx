'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, Code2 } from 'lucide-react';

interface QuickStartProps {
  activeKeyToken: string;
}

export function QuickStart({ activeKeyToken }: QuickStartProps) {
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'node'>('python');
  const [copied, setCopied] = useState(false);

  const snippets = {
    python: `# 1-line change: Just update base_url!
from openai import OpenAI

client = OpenAI(
    base_url="https://devvproxy.vercel.app/api/v1",  # DevvProxy Edge Gateway
    api_key="${activeKeyToken}"
)

# All PII is automatically scrubbed at the edge before reaching OpenAI
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "Process refund for client at ceo@acme.com card 4532-1188-9922-3344"}
    ]
)

print(response.choices[0].message.content)`,

    node: `// 1-line change: Just update baseURL!
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://devvproxy.vercel.app/api/v1', // DevvProxy Edge Gateway
  apiKey: '${activeKeyToken}'
});

async function run() {
  // Identical calls resolve in 0ms from cache ($0 token cost)
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: 'Customer SSN 123-45-6789 requested billing statement.' }
    ]
  });

  console.log(completion.choices[0].message.content);
}

run();`,

    curl: `curl https://devvproxy.vercel.app/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${activeKeyToken}" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "My contact is john@doe.com phone +1-555-0199"}
    ]
  }'`,
  };

  const currentSnippet = snippets[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="quickstart" className="rounded-xl bg-surface-1 border border-border-subtle overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3 bg-surface-0/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-surface-2 text-primary">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-white">
              Zero-Code-Refactor Integration (1 Line)
            </h3>
            <p className="text-xs text-zinc-400 font-sans">
              Works directly with any OpenAI SDK, LangChain, or Vercel AI SDK
            </p>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 bg-surface-editor p-1 rounded-lg border border-border-subtle text-xs font-mono">
          <button
            onClick={() => setActiveTab('python')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'python'
                ? 'bg-primary text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Python (OpenAI)
          </button>
          <button
            onClick={() => setActiveTab('node')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'node'
                ? 'bg-primary text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Node.js / TS
          </button>
          <button
            onClick={() => setActiveTab('curl')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'curl'
                ? 'bg-primary text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            cURL
          </button>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="p-5 bg-surface-editor relative">
        <button
          onClick={handleCopy}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-surface-2 hover:bg-zinc-800 text-xs font-mono text-zinc-300 hover:text-white border border-border-subtle transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>

        <pre className="font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed pr-24">
          <code>{currentSnippet}</code>
        </pre>
      </div>
    </div>
  );
}
