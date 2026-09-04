import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
        <span className="exam-title" title={pack.title}>
          {pack.title}
        </span>
        <Timer
          remainingSeconds={remaining}
          totalSeconds={attempt.durationSeconds}
        />
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowPaletteMobile(prev => !prev)}
          aria-label="Toggle question palette"
          style={{ color: 'white', borderColor: 'rgba(255,255,255,.35)' }}
        >
          ☰ Palette
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => setShowSubmitModal(true)}>
          Submit Test
        </button>
      </header>

      {/* Body */}
      <div className="exam-body">
        {/* Question pane */}
        <main className="question-pane">
          <div className="question-pane-header">
            <div className="question-number-badge">{currentIdx + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentQ.num} — {currentQ.title}
              </div>
            </div>
            <span className="question-type-badge">{currentQ.type.replace('_', ' ')}</span>
            {currentQState?.markedForReview && (
              <span style={{ fontSize: '0.75rem', background: '#f3e8ff', color: '#7c3aed', borderRadius: '12px', padding: '0.15rem 0.55rem', fontWeight: 600 }}>
                🔖 Marked
              </span>
            )}
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

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { toggleMarkForReview(currentQ.id); }}
              style={{ color: currentQState?.markedForReview ? '#7c3aed' : undefined }}
            >
              🔖 {currentQState?.markedForReview ? 'Unmark' : 'Mark for Review'} & Next
            </button>

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => clearAnswer(currentQ.id)}
            >
              ✕ Clear
            </button>

            <div className="spacer" />

            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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
        {showPaletteMobile && (
          <div
            onClick={() => setShowPaletteMobile(false)}
            style={{
              display: 'none',
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,.4)',
              zIndex: 199,
            }}
            aria-hidden="true"
          />
        )}
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
