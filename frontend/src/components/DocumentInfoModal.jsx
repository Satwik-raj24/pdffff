import React from 'react';
import { X, FileText, Layers, Hash, Calendar, CheckCircle2 } from 'lucide-react';

export default function DocumentInfoModal({ isOpen, onClose, document }) {
  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-surface border border-surface-border rounded-2xl shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-accent">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Document Information</h3>
              <p className="text-xs text-text-muted truncate max-w-xs">{document.filename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-white hover:bg-surface-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details Grid */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-surface-border bg-surface-subtle">
              <div className="flex items-center gap-1.5 text-text-muted mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Total Pages</span>
              </div>
              <div className="text-lg font-bold text-white">{document.total_pages}</div>
            </div>

            <div className="p-3 rounded-xl border border-surface-border bg-surface-subtle">
              <div className="flex items-center gap-1.5 text-text-muted mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Text Chunks</span>
              </div>
              <div className="text-lg font-bold text-accent">{document.total_chunks}</div>
            </div>

            <div className="p-3 rounded-xl border border-surface-border bg-surface-subtle">
              <div className="flex items-center gap-1.5 text-text-muted mb-1">
                <Hash className="w-3.5 h-3.5" />
                <span>File Size</span>
              </div>
              <div className="text-sm font-semibold text-white">{document.file_size_formatted}</div>
            </div>

            <div className="p-3 rounded-xl border border-surface-border bg-surface-subtle">
              <div className="flex items-center gap-1.5 text-text-muted mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Uploaded</span>
              </div>
              <div className="text-xs font-medium text-white truncate">{document.uploaded_at}</div>
            </div>
          </div>

          {/* Academic Viva Architecture Box */}
          <div className="p-3.5 rounded-xl border border-accent-border/40 bg-accent-muted/30">
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-accent-light">Indexing & Retrieval Architecture</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              This PDF was extracted page-by-page using PyMuPDF and split into overlapping chunks (700 chars / 150 overlap).
              Indexed with Scikit-learn TF-IDF sublinear scaling and cosine similarity for factual, grounded answers.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-border bg-surface-subtle flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-text-secondary hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

