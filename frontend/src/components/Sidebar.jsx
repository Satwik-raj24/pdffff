import React from 'react';
import {
  BookOpen,
  Plus,
  MessageSquare,
  FileText,
  Trash2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  Upload
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  onToggle,
  documents,
  activeDocument,
  onSelectDocument,
  onDeleteDocument,
  onNewChat,
  onOpenSettings,
  onOpenDocInfo,
  onOpenUpload,
  conversations,
  activeConversationId,
  onSelectConversation,
  onClearCurrentChat
}) {
  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-40 bg-surface border-r border-surface-border flex flex-col transition-all duration-300 ease-in-out ${
        isOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-16'
      }`}
    >
      {/* Top Header & Logo */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-surface-border">
        {isOpen ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-accent flex-shrink-0 shadow-subtle">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="font-semibold text-sm tracking-tight text-white block">
                Smart Notes AI
              </span>
              <span className="text-[10px] text-accent tracking-wider uppercase block font-medium">
                Academic Assistant
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-accent shadow-subtle">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors hidden md:block"
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Action Buttons: New Chat & Upload */}
      <div className="p-3 space-y-2 border-b border-surface-border/60">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-surface-border bg-surface-subtle hover:bg-surface-hover text-text-primary text-xs font-medium transition-colors ${
            !isOpen ? 'md:px-0' : ''
          }`}
          title="New Study Session"
        >
          <Plus className="w-4 h-4 text-accent" />
          {isOpen && <span>New Study Chat</span>}
        </button>

        {isOpen && (
          <button
            onClick={onOpenUpload}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-accent text-black font-semibold text-xs hover:bg-accent-hover transition-colors shadow-subtle"
          >
            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Upload New PDF</span>
          </button>
        )}
      </div>

      {/* Scrollable Document & History List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {/* Uploaded Documents Section */}
        <div>
          {isOpen ? (
            <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
              <span>Study Documents ({documents.length})</span>
            </div>
          ) : (
            <div className="w-full text-center text-[10px] text-text-muted uppercase mb-2 font-mono">
              PDFs
            </div>
          )}

          {documents.length === 0 ? (
            isOpen ? (
              <div className="px-2 py-4 text-center rounded-xl border border-dashed border-surface-border/60 bg-surface-subtle/40">
                <FileText className="w-6 h-6 text-text-muted mx-auto mb-1.5 opacity-50" />
                <p className="text-xs text-text-secondary">No notes uploaded</p>
                <p className="text-[10px] text-text-muted mt-0.5">Upload a PDF to begin</p>
              </div>
            ) : null
          ) : (
            <div className="space-y-1">
              {documents.map((doc) => {
                const isActive = activeDocument?.document_id === doc.document_id;
                return (
                  <div
                    key={doc.document_id}
                    className={`group relative flex items-center rounded-xl text-xs transition-colors ${
                      isActive
                        ? 'bg-surface-active border border-accent-border/50 text-white font-medium'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectDocument(doc)}
                      className="flex-1 flex items-center gap-2.5 p-2 min-w-0 text-left"
                      title={doc.filename}
                    >
                      <FileText
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? 'text-accent' : 'text-text-muted'
                        }`}
                      />
                      {isOpen && (
                        <div className="truncate flex-1">
                          <div className="truncate">{doc.filename}</div>
                          <div className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5">
                            <span>{doc.total_pages} pages</span>
                            <span>•</span>
                            <span>{doc.total_chunks} chunks</span>
                          </div>
                        </div>
                      )}
                    </button>

                    {isOpen && (
                      <div className="flex items-center pr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDocInfo(doc);
                          }}
                          className="p-1 rounded hover:bg-surface text-text-muted hover:text-text-primary"
                          title="Document info"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDocument(doc.document_id);
                          }}
                          className="p-1 rounded hover:bg-red-950/40 text-text-muted hover:text-red-400"
                          title="Remove document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Conversations / Study Threads */}
        {isOpen && conversations.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
              <span>Recent Sessions</span>
            </div>
            <div className="space-y-1">
              {conversations.map((conv) => {
                const isActive = activeConversationId === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-left truncate transition-colors ${
                      isActive
                        ? 'bg-surface-active text-white font-medium'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                    <span className="truncate flex-1">{conv.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls: Settings & Clear Chat */}
      <div className="p-3 border-t border-surface-border/60 bg-surface-subtle/50 space-y-1">
        <button
          onClick={onOpenSettings}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors ${
            !isOpen ? 'justify-center px-0' : ''
          }`}
          title="System Settings"
        >
          <Settings className="w-4 h-4 text-text-muted" />
          {isOpen && <span>Settings & API</span>}
        </button>
      </div>
    </aside>
  );
}

