import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, FileText, CheckCircle } from 'lucide-react';

export default function SourceReference({ sources }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!sources || sources.length === 0) return null;

  const toggleSource = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="mt-4 pt-3 border-t border-surface-border/60">
      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-text-secondary uppercase tracking-wider">
        <BookOpen className="w-3.5 h-3.5 text-accent" />
        <span>Grounded Sources ({sources.length} PDF Excerpts)</span>
      </div>

      <div className="space-y-2">
        {sources.map((source, idx) => {
          const isExpanded = expandedIndex === idx;
          const matchPercent = Math.min(100, Math.round((source.similarity_score || 0.1) * 100));

          return (
            <div
              key={idx}
              className="rounded-lg border border-surface-border bg-surface-subtle overflow-hidden transition-all duration-150"
            >
              <button
                type="button"
                onClick={() => toggleSource(idx)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-hover/70 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-semibold bg-accent-muted text-accent border border-accent-border">
                    Page {source.page_number}
                  </span>
                  {source.similarity_score !== undefined && (
                    <span className="text-[11px] text-text-muted">
                      {matchPercent > 0 ? `${matchPercent}% relevance` : 'Document Context'}
                    </span>
                  )}
                  <span className="text-xs text-text-secondary truncate max-w-[280px] sm:max-w-md hidden sm:inline">
                    "{source.text?.substring(0, 70)}..."
                  </span>
                </div>

                <div className="flex items-center text-text-muted">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-text-secondary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-secondary" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3.5 py-3 border-t border-surface-border/60 bg-[#101217] text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">
                  <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-sans font-medium text-emerald-400">
                    <CheckCircle className="w-3 h-3" />
                    <span>Exact Text Extracted from Original PDF Page {source.page_number}:</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface border border-surface-border text-gray-300 selection:bg-accent/30">
                    {source.text}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

