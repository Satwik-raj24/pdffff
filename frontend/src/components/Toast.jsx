import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border shadow-elevated backdrop-blur-md ${
          isError
            ? 'bg-[#181214] border-red-900/60 text-red-200'
            : isSuccess
            ? 'bg-[#111915] border-emerald-900/60 text-emerald-200'
            : 'bg-[#14161f] border-surface-border text-gray-200'
        }`}
      >
        <div className="mt-0.5 flex-shrink-0">
          {isError ? (
            <AlertCircle className="w-5 h-5 text-red-400" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <Info className="w-5 h-5 text-blue-400" />
          )}
        </div>

        <div className="flex-1 text-sm leading-relaxed">
          {toast.title && <div className="font-semibold mb-0.5 text-white">{toast.title}</div>}
          <div className="break-words text-xs opacity-90">{toast.message}</div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

