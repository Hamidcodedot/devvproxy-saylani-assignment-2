'use client';

import React, { useState } from 'react';
import { X, Key, Plus, Trash2, Check, Copy, AlertCircle } from 'lucide-react';
import { ApiKeyRecord } from '@/types';

interface KeyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: ApiKeyRecord[];
  onKeyCreated: () => void;
  onKeyRevoked: () => void;
  activeKey: ApiKeyRecord | null;
  onSelectKey: (k: ApiKeyRecord) => void;
}

export function KeyManagerModal({
  isOpen,
  onClose,
  keys,
  onKeyCreated,
  onKeyRevoked,
  activeKey,
  onSelectKey,
}: KeyManagerModalProps) {
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newKeyName.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewlyGeneratedKey(data.plainTextKey);
        setNewKeyName('');
        onKeyCreated();
      }
    } catch (err) {
      console.error('Failed to create key', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        onKeyRevoked();
      }
    } catch (err) {
      console.error('Failed to revoke key', err);
    }
  };

  const copyGeneratedKey = () => {
    if (!newlyGeneratedKey) return;
    navigator.clipboard.writeText(newlyGeneratedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl bg-surface-1 border border-border-subtle shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-0">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            <h3 className="font-mono text-sm font-bold text-white">
              Virtual API Key Vault
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-2 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Newly Generated Key Alert */}
          {newlyGeneratedKey && (
            <div className="p-3 rounded-lg bg-surface-2 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                New Virtual Key Generated! Save it now:
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={newlyGeneratedKey}
                  className="flex-1 px-2.5 py-1.5 rounded bg-surface-editor border border-emerald-500/30 font-mono text-xs text-emerald-200 select-all"
                />
                <button
                  onClick={copyGeneratedKey}
                  className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  {copiedKey ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-emerald-400/80 font-sans">
                For security, this secret key will never be shown again. It is hashed via SHA-256 before storage.
              </p>
            </div>
          )}

          {/* Key Creation Form */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 block">
              Generate New Virtual Key
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Staging App, CI/CD Pipeline"
                className="flex-1 px-3 py-1.5 rounded-md bg-surface-2 border border-border-subtle text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleCreate}
                disabled={!newKeyName.trim() || isCreating}
                className="px-4 py-1.5 rounded-md bg-primary hover:bg-primary-bright text-black font-mono font-bold text-xs flex items-center gap-1 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Generate
              </button>
            </div>
          </div>

          {/* Existing Keys List */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-zinc-400 block">
              Active Virtual Keys ({keys.filter((k) => k.is_active).length})
            </span>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between transition-colors ${
                    activeKey?.id === k.id
                      ? 'bg-surface-2 border-primary/50 text-white'
                      : k.is_active
                      ? 'bg-surface-0 border-border-subtle text-zinc-300'
                      : 'bg-surface-0/40 border-zinc-800 text-zinc-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{k.name}</span>
                      {activeKey?.id === k.id && (
                        <span className="px-1.5 py-0.2 rounded bg-primary/20 text-primary text-[10px]">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {k.prefix} • {k.rate_limit_rpm} RPM • {k.is_active ? 'Active' : 'Revoked'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {k.is_active && activeKey?.id !== k.id && (
                      <button
                        onClick={() => onSelectKey(k)}
                        className="px-2 py-1 rounded bg-surface-2 hover:bg-zinc-700 text-zinc-300 text-[11px]"
                      >
                        Select
                      </button>
                    )}
                    {k.is_active && (
                      <button
                        onClick={() => handleRevoke(k.id)}
                        className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border-subtle bg-surface-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-surface-2 hover:bg-zinc-800 text-xs font-mono text-zinc-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
