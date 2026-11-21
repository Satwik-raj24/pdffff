import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Sparkles, User, Clock, AlertTriangle } from 'lucide-react';
import SourceReference from './SourceReference';

export default function MessageItem({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isError = message.isError;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`py-5 px-4 md:px-6 transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-surface/50 border-y border-surface-border/40'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4 md:gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-lg bg-surface-border flex items-center justify-center text-text-secondary border border-surface-border/80">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-accent shadow-subtle">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-primary">
                {isUser ? 'You' : 'Smart Notes AI'}
              </span>
              {!isUser && message.model && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface border border-surface-border text-text-muted">
                  {message.model}
                </span>
              )}
              {message.timestamp && (
                <span className="text-[11px] text-text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {message.timestamp}
                </span>
              )}
            </div>

            {!isUser && (
              <button
                onClick={handleCopy}
                className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-accent" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Body */}
          {isError ? (
            <div className="p-3.5 rounded-lg border border-red-900/60 bg-red-950/20 text-red-300 text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium mb-1">Response Generation Notice</p>
                <p className="text-xs text-red-200/90 leading-relaxed">{message.content}</p>
              </div>
            </div>
          ) : isUser ? (
            <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          ) : (
            <div className="prose-dark max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>

              {/* Source References */}
              {message.sources && message.sources.length > 0 && (
                <SourceReference sources={message.sources} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

