import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X,
  Sparkles,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Award,
  Loader2,
  Search,
  FileText
} from 'lucide-react';

export default function StudyToolsModal({
  isOpen,
  mode, // 'quiz' | 'concept' | 'summary' | 'questions'
  onClose,
  data, // quiz questions array or markdown string
  isLoading,
  onExplainConcept,
  onGenerateQuiz,
  onGenerateSummary,
  onGenerateQuestions,
  activeDocument
}) {
  const [conceptQuery, setConceptQuery] = useState('');
  // Quiz runner states
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qIndex]: optionKey }
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  if (!isOpen) return null;

  // Handle quiz answer selection
  const handleSelectOption = (qIndex, optionLetter, isCorrect) => {
    if (selectedAnswers[qIndex] !== undefined) return; // Already answered

    const newSelected = { ...selectedAnswers, [qIndex]: optionLetter };
    setSelectedAnswers(newSelected);

    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = (totalQuestions) => {
    if (currentQuizIndex < totalQuestions - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedAnswers({});
    setScore(0);
    setQuizFinished(false);
  };

  const handleConceptSubmit = (e) => {
    e.preventDefault();
    if (conceptQuery.trim() && onExplainConcept) {
      onExplainConcept(conceptQuery.trim());
    }
  };

  const titles = {
    quiz: 'Interactive Study Quiz (MCQs)',
    concept: 'Concept Deep-Dive Explainer',
    summary: 'Comprehensive Document Summary',
    questions: 'High-Yield Exam Questions'
  };

  const icons = {
    quiz: CheckCircle2,
    concept: BookOpen,
    summary: Sparkles,
    questions: HelpCircle
  };

  const IconComponent = icons[mode] || Sparkles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[88vh] bg-surface border border-surface-border rounded-2xl shadow-elevated flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-muted border border-accent-border flex items-center justify-center text-accent">
              <IconComponent className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">{titles[mode]}</h2>
              <p className="text-xs text-text-secondary truncate max-w-sm">
                {activeDocument?.filename || 'Uploaded Document'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
              <p className="text-sm font-medium text-text-primary">Generating AI Study Material...</p>
              <p className="text-xs text-text-muted mt-1 max-w-xs">
                Scanning document sections and analyzing concepts with Gemini.
              </p>
            </div>
          ) : mode === 'quiz' ? (
            /* ================= INTERACTIVE QUIZ MODE ================= */
            <div>
              {!data || data.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-text-secondary mb-4">No quiz generated yet.</p>
                  <button
                    onClick={() => onGenerateQuiz && onGenerateQuiz()}
                    className="px-4 py-2 rounded-xl bg-accent text-black font-semibold text-xs hover:bg-accent-hover transition-colors"
                  >
                    Generate Practice Quiz Now
                  </button>
                </div>
              ) : quizFinished ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-muted border border-accent flex items-center justify-center text-accent">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Quiz Completed!</h3>
                  <p className="text-sm text-text-secondary mb-6">
                    You scored <span className="font-bold text-accent text-base">{score}</span> out of{' '}
                    <span className="font-bold text-white text-base">{data.length}</span> (
                    {Math.round((score / data.length) * 100)}%)
                  </p>

                  <div className="flex justify-center gap-3">
                    <button
                      onClick={handleRestartQuiz}
                      className="px-4 py-2.5 rounded-xl border border-surface-border hover:bg-surface-hover text-text-primary text-xs font-medium flex items-center gap-2 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retake Quiz
                    </button>
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl bg-accent text-black font-semibold text-xs hover:bg-accent-hover transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Progress indicator */}
                  <div className="flex items-center justify-between text-xs text-text-secondary mb-4">
                    <span>
                      Question {currentQuizIndex + 1} of {data.length}
                    </span>
                    <span className="font-mono text-accent">Score: {score}</span>
                  </div>

                  <div className="w-full bg-surface-border rounded-full h-1.5 mb-6">
                    <div
                      className="bg-accent h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${((currentQuizIndex + 1) / data.length) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Current Question */}
                  {(() => {
                    const q = data[currentQuizIndex];
                    const selected = selectedAnswers[currentQuizIndex];
                    const hasAnswered = selected !== undefined;

                    return (
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-white mb-4 leading-snug">
                          {q.question}
                        </h3>

                        {/* Options */}
                        <div className="space-y-2.5 mb-5">
                          {q.options.map((opt, optIdx) => {
                            // Extract letter (A, B, C, D)
                            const optLetter = opt.trim().substring(0, 1).toUpperCase();
                            const isCorrectOpt =
                              optLetter === (q.correct_answer || '').toUpperCase().trim();
                            const isUserSelected = selected === optLetter;

                            let btnStyle =
                              'border-surface-border bg-surface-subtle hover:bg-surface-hover text-text-primary';

                            if (hasAnswered) {
                              if (isCorrectOpt) {
                                btnStyle =
                                  'border-emerald-600 bg-emerald-950/40 text-emerald-200';
                              } else if (isUserSelected && !isCorrectOpt) {
                                btnStyle =
                                  'border-red-600 bg-red-950/40 text-red-200';
                              } else {
                                btnStyle =
                                  'border-surface-border/40 opacity-40 bg-surface-subtle';
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={hasAnswered}
                                onClick={() =>
                                  handleSelectOption(
                                    currentQuizIndex,
                                    optLetter,
                                    isCorrectOpt
                                  )
                                }
                                className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-all ${btnStyle}`}
                              >
                                <span className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center font-mono text-xs font-semibold bg-surface border border-surface-border">
                                  {optLetter}
                                </span>
                                <span className="flex-1 mt-0.5">{opt}</span>
                                {hasAnswered && isCorrectOpt && (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                )}
                                {hasAnswered && isUserSelected && !isCorrectOpt && (
                                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation & Next */}
                        {hasAnswered && (
                          <div className="mt-4 p-4 rounded-xl border border-surface-border bg-surface-subtle animate-in fade-in duration-150">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-bold text-accent">Explanation:</span>
                              {q.page_number && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-muted text-accent border border-accent-border font-mono">
                                  Source: Page {q.page_number}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed">
                              {q.explanation}
                            </p>

                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={() => handleNextQuestion(data.length)}
                                className="px-4 py-2 rounded-xl bg-accent text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-accent-hover transition-colors"
                              >
                                <span>
                                  {currentQuizIndex < data.length - 1
                                    ? 'Next Question'
                                    : 'View Final Score'}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : mode === 'concept' ? (
            /* ================= CONCEPT EXPLAINER MODE ================= */
            <div>
              <form onSubmit={handleConceptSubmit} className="mb-6">
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Which concept would you like Smart Notes AI to explain?
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                    <input
                      type="text"
                      value={conceptQuery}
                      onChange={(e) => setConceptQuery(e.target.value)}
                      placeholder="e.g. Backpropagation, Activation Functions, Overfitting..."
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!conceptQuery.trim()}
                    className="px-4 py-2.5 rounded-xl bg-accent text-black font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-hover transition-colors"
                  >
                    Explain
                  </button>
                </div>
              </form>

              {data && (
                <div className="prose-dark border-t border-surface-border pt-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{data}</ReactMarkdown>
                </div>
              )}
            </div>
          ) : (
            /* ================= SUMMARY OR QUESTIONS MODE ================= */
            <div>
              {data ? (
                <div className="prose-dark">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{data}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-10 text-text-secondary text-xs">
                  Click generate to analyze notes with Gemini.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-surface-border bg-surface-subtle flex items-center justify-between text-xs text-text-muted">
          <span>Smart Notes AI Study Assistant</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-surface-border text-text-secondary hover:text-white hover:bg-surface-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

