import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function UploadModal({
  isOpen,
  onClose,
  onUploadFile,
  onLoadSampleNotes,
  isUploading
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file) => {
    setError(null);
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Invalid file format. Please upload a PDF document (.pdf).');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setError('File size exceeds the 30 MB limit. Please upload a smaller document.');
      return;
    }

    if (file.size === 0) {
      setError('The selected PDF file is empty (0 bytes).');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = () => {
    if (selectedFile && onUploadFile) {
      onUploadFile(selectedFile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-surface border border-surface-border rounded-2xl shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-muted border border-accent-border flex items-center justify-center text-accent">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Upload Study Notes</h3>
              <p className="text-xs text-text-muted">PDF Text Extraction & Indexing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1 rounded-md text-text-muted hover:text-white hover:bg-surface-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? 'border-accent bg-accent-muted/20'
                : 'border-surface-border hover:border-accent/40 bg-surface-subtle/50'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleChange}
              className="hidden"
            />

            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface border border-surface-border flex items-center justify-center text-accent shadow-subtle">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-sm font-medium text-white mb-1">
              {selectedFile ? selectedFile.name : 'Click to browse or drag & drop PDF'}
            </p>
            <p className="text-xs text-text-muted">
              {selectedFile
                ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for processing`
                : 'Supports textbooks, lecture slides, and notes (up to 30 MB)'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl border border-red-900/60 bg-red-950/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Preloaded Sample */}
          <div className="p-3.5 rounded-xl border border-surface-border bg-surface-subtle flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-accent" />
              <div>
                <div className="text-xs font-medium text-white">Live Demo / Viva Sample</div>
                <div className="text-[11px] text-text-muted">AI & Deep Learning Notes (3 Pages)</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onLoadSampleNotes}
              disabled={isUploading}
              className="px-3 py-1.5 rounded-lg border border-accent-border bg-accent-muted text-accent hover:bg-accent hover:text-black font-semibold text-xs transition-colors"
            >
              Load Sample
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-border bg-surface-subtle flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl text-xs text-text-secondary hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUploadSubmit}
            disabled={!selectedFile || isUploading}
            className="px-5 py-2 rounded-xl bg-accent text-black font-semibold text-xs hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-subtle"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing PDF...</span>
              </>
            ) : (
              <span>Extract & Index PDF</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

