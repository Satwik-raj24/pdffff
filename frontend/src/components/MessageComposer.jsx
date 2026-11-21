import React, { useRef, useEffect } from 'react';
import { ArrowUp, Loader2, Sparkles } from 'lucide-react';

export default function MessageComposer({
  input,
  setInput,
  onSend,
  isLoading,
  hasActiveDocument,
  documentName
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea based on input height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && hasActiveDocument && input.trim()) {
        onSend();
      }
    }
  };

  const isButtonDisabled = isLoading || !hasActiveDocument || !input.trim();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 md:pb-6 pt-2">
      <div className="relative rounded-2xl border border-surface-border bg-surface shadow-elevated focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20 transition-all duration-150">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!hasActiveDocument || isLoading}
          rows={1}
          placeholder={
            hasActiveDocument
              ? `Ask any question from "${documentName}" (e.g. key concepts, formulas, exam topics)...`
              : 'Please upload a PDF document first to begin studying...'
          }
          className="w-full bg-transparent px-4 py-3.5 pr-14 text-sm text-text-primary placeholder:text-text-muted focus:outline-none resize-none max-h-48 disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
        />

        <div className="absolute right-2.5 bottom-2.5">
          <button
            type="button"
            onClick={onSend}
            disabled={isButtonDisabled}
            className={`p-2 rounded-xl transition-all duration-150 flex items-center justify-center ${
              isButtonDisabled
                ? 'bg-surface-border/50 text-text-muted cursor-not-allowed'
                : 'bg-accent hover:bg-accent-hover text-black font-semibold shadow-subtle active:scale-95'
            }`}
            title={!hasActiveDocument ? 'Upload a PDF to ask questions' : 'Send question (Enter)'}
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-accent-light" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-text-muted">
        <div className="flex items-center gap-1.5 truncate">
          <Sparkles className="w-3 h-3 text-accent flex-shrink-0" />
          <span className="truncate">
            Answers are grounded strictly in your uploaded PDF with page citations.
          </span>
        </div>
        <div className="hidden sm:block text-text-muted/70 flex-shrink-0">
          <span className="font-mono text-[10px] bg-surface px-1 py-0.5 rounded border border-surface-border">Enter</span> to send, <span className="font-mono text-[10px] bg-surface px-1 py-0.5 rounded border border-surface-border">Shift+Enter</span> for new line
        </div>
      </div>
    </div>
  );
}

