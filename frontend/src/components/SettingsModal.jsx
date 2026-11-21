import React from 'react';
import { X, Settings, ShieldCheck, Cpu, HardDrive, Key, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  health,
  onRefreshHealth,
  onClearChat
}) {
  if (!isOpen) return null;

  const isConfigured = health?.gemini_configured;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-surface border border-surface-border rounded-2xl shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-border flex items-center justify-center text-text-primary">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">System & AI Settings</h3>
              <p className="text-xs text-text-muted">Smart Notes AI Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-white hover:bg-surface-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Health Status */}
          <div className="p-3.5 rounded-xl border border-surface-border bg-surface-subtle flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  health?.status === 'healthy' ? 'bg-accent animate-pulse' : 'bg-red-500'
                }`}
              />
              <div>
                <div className="text-xs font-semibold text-white">FastAPI Backend</div>
                <div className="text-[11px] text-text-muted">
                  {health?.status === 'healthy' ? 'Connected (Port 8000)' : 'Disconnected'}
                </div>
              </div>
            </div>

            <button
              onClick={onRefreshHealth}
              className="p-1.5 rounded-md hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
              title="Refresh connection status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Gemini Model Info */}
          <div className="p-3.5 rounded-xl border border-surface-border bg-surface-subtle space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Configured Model
              </span>
              <span className="font-mono text-accent font-medium">
                {health?.gemini_model || 'gemini-2.5-flash'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                Gemini API Key
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  isConfigured
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                }`}
              >
                {isConfigured ? 'Configured & Active' : 'Not Configured in .env'}
              </span>
            </div>
          </div>

          {/* API Setup Instructions */}
          {!isConfigured && (
            <div className="p-3.5 rounded-xl border border-amber-800/40 bg-amber-950/20 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span>Quick Setup for Viva & Live Demo</span>
              </div>
              <p className="text-text-secondary leading-relaxed text-[11px]">
                To enable live AI answers, open <code className="text-amber-200">backend/.env</code> and set:
              </p>
              <div className="p-2 rounded bg-black/50 font-mono text-[11px] text-amber-300 select-all">
                GEMINI_API_KEY=AIzaSy...
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline mt-1"
              >
                <span>Get a free Gemini API key at Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Reset Options */}
          <div className="pt-2 border-t border-surface-border">
            <button
              onClick={() => {
                onClearChat();
                onClose();
              }}
              className="w-full py-2 px-3 rounded-xl border border-red-900/50 hover:bg-red-950/30 text-red-300 text-xs font-medium transition-colors"
            >
              Clear Current Conversation History
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-border bg-surface-subtle flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-text-secondary hover:text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

