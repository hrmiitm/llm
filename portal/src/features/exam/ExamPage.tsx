import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { GAPack } from '../../types';
import { fetchPack } from '../../lib/content';
import { loadActiveAttemptForGA } from '../../storage/db';
import { useExamStore } from '../../store/examStore';
import { QuestionRenderer } from '../../components/QuestionRenderer';
import { Timer } from '../../components/Timer';
import { Palette } from '../../components/Palette';
import { Modal } from '../../components/Modal';
import { formatTime } from '../../lib/scoring';

export function ExamPage() {
  const { gaId } = useParams<{ gaId: string }>();
  const navigate = useNavigate();
  const [pack, setPack] = useState<GAPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaletteMobile, setShowPaletteMobile] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { attempt, startExam, setAnswer, clearAnswer, toggleMarkForReview, navigateTo, submitExam, tickTimer, reset } = useExamStore();

  const handleSubmit = useCallback((autoSubmit = false) => {
    if (!autoSubmit) {
      setShowSubmitModal(true);
    } else {
      const r = submitExam();
      if (r) {
        navigate(`/results/${r.attemptId}`, { state: { result: r, gaTitle: pack?.title } });
      }
    }
  }, [submitExam, navigate, pack]);

  const confirmSubmit = useCallback(() => {
    setShowSubmitModal(false);
    const r = submitExam();
    if (r) {
      navigate(`/results/${r.attemptId}`, { state: { result: r, gaTitle: pack?.title } });
    }
  }, [submitExam, navigate, pack]);

  // Load pack and init/resume exam
  useEffect(() => {
    if (!gaId) return;
    reset();
    fetchPack(gaId)
      .then(async (p) => {
        setPack(p);
        const existing = await loadActiveAttemptForGA(gaId);
        startExam(p, existing);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gaId]);

  // Timer tick
  useEffect(() => {
    if (!attempt || attempt.submitted) return;
    timerRef.current = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [attempt?.submitted, !attempt]);

  // Auto-submit on time expiry
  useEffect(() => {
    if (!attempt || attempt.submitted) return;
    const remaining = attempt.durationSeconds - attempt.elapsedSeconds;
    if (remaining <= 0) {
      handleSubmit(true);
    }
  }, [attempt?.elapsedSeconds, attempt?.durationSeconds, attempt?.submitted, handleSubmit]);

  if (loading) return (
    <div className="exam-shell">
      <div className="loading-center">
        <div className="spinner" />
        <p>Loading exam…</p>
      </div>
    </div>
  );

  if (error || !pack || !attempt) return (
    <div className="exam-shell">
      <div className="error-box">⚠️ {error || 'Failed to load exam'}</div>
    </div>
  );

  const currentIdx = attempt.currentQuestion;
  const currentQ = pack.questions[currentIdx];
  if (!currentQ) return null;

  const currentQState = attempt.questions[currentQ.id];
  const selectedAnswer = currentQState?.answer ?? null;
  const remaining = Math.max(0, attempt.durationSeconds - attempt.elapsedSeconds);

  // Submit modal stats
  const answered = Object.values(attempt.questions).filter(s =>
    s.answer !== null && (typeof s.answer === 'string' ? s.answer.trim() !== '' : s.answer.length > 0)
  ).length;
  const marked = Object.values(attempt.questions).filter(s => s.markedForReview).length;
  const unanswered = pack.questions.length - answered;

  return (
    <div className="exam-shell">
      {/* Header */}
      <header className="exam-header">
        <Link to="/" className="exam-brand" aria-label="Back to home">
          <span className="exam-brand-mark">LLM</span>
          <span className="exam-brand-copy"><strong>Exam Console</strong><small>{pack.title}</small></span>
        </Link>
        <div className="exam-session-meta">
          <span className="session-label">Section</span>
          <strong>All Questions</strong>
          <span className="session-divider" />
          <span><strong>{pack.questions.length}</strong> questions</span>
        </div>
        <Timer remainingSeconds={remaining} totalSeconds={attempt.durationSeconds} />
        <button className="btn btn-ghost btn-sm mobile-palette-toggle" onClick={() => setShowPaletteMobile(prev => !prev)} aria-label="Toggle question palette">☰ Palette</button>
        <button className="btn btn-danger btn-sm" onClick={() => setShowSubmitModal(true)}>Submit Test</button>
      </header>

      <div className="exam-subheader">
        <div><span className="subheader-label">Question paper</span><strong>{pack.title}</strong></div>
        <div className="exam-subheader-right"><span>Auto-save on</span><span className="save-dot" /> <span>Time remaining <strong>{formatTime(remaining)}</strong></span></div>
      </div>

      {/* Body */}
      <div className="exam-body">
        {/* Question pane */}
        <main className="question-pane">
          <div className="question-pane-header">
            <div className="question-number-badge">{currentIdx + 1}</div>
            <div className="question-heading-copy"><span>Question {currentIdx + 1} of {pack.questions.length}</span><strong>{currentQ.title || currentQ.num}</strong></div>
            <span className="question-type-badge">{currentQ.type.replace('_', ' ')}</span>
            {currentQState?.markedForReview && <span className="practice-checked-badge marked-badge">🔖 Marked</span>}
          </div>

          <div className="question-pane-scroll">
            <QuestionRenderer
              question={currentQ}
              selectedAnswer={selectedAnswer}
              onAnswer={(val) => setAnswer(currentQ.id, val)}
            />
          </div>

          {/* Footer */}
          <div className="exam-footer">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigateTo(currentIdx - 1)}
              disabled={currentIdx === 0}
            >
              ← Previous
            </button>

            <button className={`btn btn-ghost btn-sm ${currentQState?.markedForReview ? 'is-marked' : ''}`} onClick={() => { toggleMarkForReview(currentQ.id); }}>
              🔖 {currentQState?.markedForReview ? 'Unmark' : 'Mark for Review'} & Next
            </button>

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => clearAnswer(currentQ.id)}
            >
              ✕ Clear
            </button>

            <div className="spacer" />

            <span className="footer-progress">
              {currentIdx + 1} / {pack.questions.length}
            </span>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (currentIdx < pack.questions.length - 1) {
                  navigateTo(currentIdx + 1);
                } else {
                  setShowSubmitModal(true);
                }
              }}
            >
              {currentIdx < pack.questions.length - 1 ? 'Save & Next →' : 'Review & Submit'}
            </button>
          </div>
        </main>

        {/* Palette */}
        <Palette
          pack={pack}
          attempt={attempt}
          currentIndex={currentIdx}
          onNavigate={navigateTo}
          mobileOpen={showPaletteMobile}
          onClose={() => setShowPaletteMobile(false)}
        />

        {/* Mobile overlay */}
        {showPaletteMobile && <div className="palette-mobile-backdrop" onClick={() => setShowPaletteMobile(false)} aria-hidden="true" />}
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <Modal
          title="Submit Exam"
          onClose={() => setShowSubmitModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowSubmitModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmSubmit}>
                Yes, Submit
              </button>
            </>
          }
        >
          <p>Are you sure you want to submit the exam? This action cannot be undone.</p>
          <div className="modal-stats">
            <div className="modal-stat">
              <div className="modal-stat-value" style={{ color: '#22c55e' }}>{answered}</div>
              <div className="modal-stat-label">Answered</div>
            </div>
            <div className="modal-stat">
              <div className="modal-stat-value" style={{ color: '#ef4444' }}>{unanswered}</div>
              <div className="modal-stat-label">Unanswered</div>
            </div>
            <div className="modal-stat">
              <div className="modal-stat-value" style={{ color: '#a855f7' }}>{marked}</div>
              <div className="modal-stat-label">Marked</div>
            </div>
          </div>
          <p style={{ fontSize: '0.875rem' }}>
            Time remaining: <strong>{formatTime(remaining)}</strong>
          </p>
        </Modal>
      )}
    </div>
  );
}
