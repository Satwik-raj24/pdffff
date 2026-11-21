import React, { useRef, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  BookOpen,
  HelpCircle,
  CheckSquare,
  UploadCloud,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Menu
} from 'lucide-react';
import MessageItem from './MessageItem';
import MessageComposer from './MessageComposer';

export default function ChatArea({
  messages,
  isLoading,
  input,
  setInput,
  onSendMessage,
  activeDocument,
  onOpenUpload,
  onLoadSampleNotes,
  onOpenSummary,
  onOpenConcept,
  onOpenQuestions,
  onOpenQuiz,
  onOpenDocInfo,
  onToggleSidebar,
  sidebarOpen
}) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const starterQuestions = [
    {
      title: "Activation Functions",
      desc: "What is the key difference between Sigmoid and ReLU activation functions?"
    },
    {
      title: "Backpropagation",
      desc: "How does the chain rule compute weight gradients during backpropagation?"
    },
    {
      title: "Preventing Overfitting",
      desc: "How does Dropout regularize a deep neural network during training?"
    },
    {
      title: "Adaptive Optimization",
      desc: "What makes the Adam optimizer superior to standard Stochastic Gradient Descent?"
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Navbar */}
      <header className="h-14 border-b border-surface-border bg-surface/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-surface-hover md:hidden transition-colors"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {activeDocument ? (
            <div className="flex items-center gap-2.5 truncate">
              <span className="p-1.5 rounded-lg bg-emerald-950/70 border border-emerald-800/40 text-accent flex-shrink-0">
                <FileText className="w-4 h-4" />
              </span>
              <div className="truncate">
                <span className="text-xs sm:text-sm font-semibold text-white truncate block">
                  {activeDocument.filename}
                </span>
                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Indexed & Ready
                  </span>
                  <span>•</span>
                  <span>{activeDocument.total_pages} Pages</span>
                  <span>•</span>
                  <span>{activeDocument.total_chunks} Chunks</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Smart Notes AI Study Workspace
              </span>
            </div>
          )}
        </div>

        {/* Quick Study Actions Bar */}
        {activeDocument && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenSummary}
              className="px-2.5 py-1.5 rounded-lg border border-surface-border bg-surface-subtle hover:bg-surface-hover text-text-secondary hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Generate comprehensive document summary"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">Summary</span>
            </button>

            <button
              onClick={onOpenConcept}
              className="px-2.5 py-1.5 rounded-lg border border-surface-border bg-surface-subtle hover:bg-surface-hover text-text-secondary hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Explain any term or concept from notes"
            >
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">Concept</span>
            </button>

            <button
              onClick={onOpenQuestions}
              className="px-2.5 py-1.5 rounded-lg border border-surface-border bg-surface-subtle hover:bg-surface-hover text-text-secondary hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Generate revision study questions"
            >
              <HelpCircle className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">Questions</span>
            </button>

            <button
              onClick={onOpenQuiz}
              className="px-3 py-1.5 rounded-lg bg-accent text-black font-semibold text-xs hover:bg-accent-hover flex items-center gap-1.5 transition-colors shadow-subtle"
              title="Practice interactive MCQs"
            >
              <CheckSquare className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">MCQ Quiz</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {!activeDocument && messages.length === 0 ? (
          /* ================= WELCOME SCREEN ================= */
          <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-8 animate-in fade-in duration-300">
            {/* Branding Hero */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-border/40 bg-accent-muted/20 text-accent text-xs font-medium mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Academic PDF Study Assistant</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Study smarter with grounded notes.
              </h1>
              <p className="text-sm md:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
                Upload your lecture slides or textbooks. Smart Notes AI extracts text, indexes sections with TF-IDF, and produces factual answers citing exact page numbers.
              </p>
            </div>

            {/* Upload Area Card */}
            <div className="p-6 md:p-8 rounded-2xl border border-surface-border bg-surface/60 shadow-elevated">
              <div
                onClick={onOpenUpload}
                className="border-2 border-dashed border-surface-border hover:border-accent/50 rounded-xl p-8 text-center cursor-pointer bg-surface-subtle/40 hover:bg-surface-hover/30 transition-all duration-200 group"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface border border-surface-border flex items-center justify-center text-accent group-hover:scale-105 transition-transform shadow-subtle">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Upload PDF Study Notes
                </h3>
                <p className="text-xs text-text-muted mb-4 max-w-sm mx-auto">
                  Drag and drop your file here, or click to browse. Supports PDF documents up to 30 MB.
                </p>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-accent text-black font-semibold text-xs hover:bg-accent-hover transition-colors shadow-subtle"
                >
                  Select PDF Document
                </button>
              </div>

              {/* Sample Notes Viva Shortcut */}
              <div className="mt-4 pt-4 border-t border-surface-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>Preparing for Viva? Test immediately with our sample notes:</span>
                </div>
                <button
                  onClick={onLoadSampleNotes}
                  className="px-3.5 py-1.5 rounded-lg border border-accent-border bg-accent-muted text-accent hover:bg-accent hover:text-black font-semibold text-xs transition-colors"
                >
                  Load Sample (Deep Learning Notes)
                </button>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-surface-border bg-surface/40">
                <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                  Page-Accurate Grounding
                </div>
                <p className="text-text-muted leading-relaxed">
                  Every answer includes original PDF page numbers so you can verify facts directly in your notes.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-surface-border bg-surface/40">
                <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-accent" />
                  TF-IDF Cosine Retrieval
                </div>
                <p className="text-text-muted leading-relaxed">
                  Statistical text ranking selects the top 3 relevant passages without bloated vector databases.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-surface-border bg-surface/40">
                <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-accent" />
                  Interactive Quiz Runner
                </div>
                <p className="text-text-muted leading-relaxed">
                  Generate multiple-choice study quizzes with live grading and detailed explanations.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ================= CHAT CONVERSATION VIEW ================= */
          <div className="pb-4">
            {/* Document Sticky Status Banner */}
            {activeDocument && messages.length === 0 && (
              <div className="max-w-3xl mx-auto px-4 py-8 text-center space-y-6">
                <div className="p-5 rounded-2xl border border-surface-border bg-surface/50 text-left">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent-muted border border-accent-border flex items-center justify-center text-accent">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">{activeDocument.filename}</h2>
                        <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                          <span>{activeDocument.total_pages} Pages</span>
                          <span>•</span>
                          <span>{activeDocument.total_chunks} Extracted Chunks</span>
                          <span>•</span>
                          <span>{activeDocument.file_size_formatted}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenDocInfo(activeDocument)}
                      className="text-xs text-accent hover:underline font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Example Questions */}
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    Try Asking a Study Question
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                    {starterQuestions.map((sq, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setInput(sq.desc)}
                        className="p-3.5 rounded-xl border border-surface-border bg-surface-subtle/70 hover:bg-surface-hover hover:border-surface-border/80 transition-all duration-150 text-left group"
                      >
                        <div className="text-xs font-semibold text-white group-hover:text-accent transition-colors mb-1">
                          {sq.title}
                        </div>
                        <div className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                          {sq.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message Thread */}
            {messages.map((msg, index) => (
              <MessageItem key={index} message={msg} />
            ))}

            {/* Thinking / Loading Indicator */}
            {isLoading && (
              <div className="py-5 px-4 md:px-6 bg-surface/50 border-y border-surface-border/40">
                <div className="max-w-4xl mx-auto flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-accent">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex-1 space-y-2 pt-1.5">
                    <div className="flex items-center gap-2 text-xs text-accent font-medium">
                      <span>Retrieving PDF passages & synthesizing answer with Gemini...</span>
                    </div>
                    <div className="h-2 bg-surface-border rounded-full w-2/3 animate-pulse" />
                    <div className="h-2 bg-surface-border rounded-full w-1/2 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Composer Area */}
      <footer className="flex-shrink-0 bg-background/95 backdrop-blur border-t border-surface-border/40">
        <MessageComposer
          input={input}
          setInput={setInput}
          onSend={onSendMessage}
          isLoading={isLoading}
          hasActiveDocument={Boolean(activeDocument)}
          documentName={activeDocument?.filename || ''}
        />
      </footer>
    </div>
  );
}

