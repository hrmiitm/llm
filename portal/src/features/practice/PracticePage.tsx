import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { GAPack } from '../../types';
import { fetchPack } from '../../lib/content';
import { QuestionRenderer } from '../../components/QuestionRenderer';
import { renderMarkdown } from '../../lib/renderer';

export function PracticePage() {
  const { gaId } = useParams<{ gaId: string }>();
  const [pack, setPack] = useState<GAPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[] | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!gaId) return;
    fetchPack(gaId)
      .then(setPack)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [gaId]);

  const goTo = (idx: number) => {
    setCurrentIdx(idx);
    setSelectedAnswer(null);
    setShowSolution(false);
    setChecked(false);
  };

  if (loading) return (
    <div className="loading-center">
      <div className="spinner" />
      <p>Loading…</p>
    </div>
  );
  if (error || !pack) return <div className="error-box">⚠️ {error || 'Failed to load'}</div>;

  const currentQ = pack.questions[currentIdx];
  if (!currentQ) return null;

  const progress = ((currentIdx + 1) / pack.questions.length) * 100;

  return (
    <div className="practice-shell">
      {/* Top nav */}
      <div className="practice-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/" className="btn btn-ghost btn-sm">← Back</Link>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{pack.title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Practice Mode</div>
          </div>
        </div>

        <div className="practice-progress">
          <span style={{ fontSize: '0.875rem' }}>{currentIdx + 1} / {pack.questions.length}</span>
          <div className="progress-bar" aria-label={`Progress: ${Math.round(progress)}%`}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Question card */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
          color: 'white',
          padding: '0.875rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div className="question-number-badge">{currentIdx + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {currentQ.num} — {currentQ.title}
            </div>
          </div>
          <span className="question-type-badge" style={{ background: 'rgba(255,255,255,.2)', color: 'white', borderColor: 'transparent' }}>
            {currentQ.type.replace('_', ' ')}
          </span>
        </div>

        {/* Card body */}
        <div style={{ padding: '1.25rem' }}>
          <QuestionRenderer
            question={currentQ}
            selectedAnswer={selectedAnswer}
            onAnswer={val => { setSelectedAnswer(val); setChecked(false); setShowSolution(false); }}
            showCorrect={checked}
            disabled={checked}
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {!checked ? (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => setChecked(true)}
                  disabled={selectedAnswer === null}
                >
                  ✓ Check Answer
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => { setShowSolution(true); setChecked(true); }}
                >
                  👁 Show Answer
                </button>
              </>
            ) : (
              <button
                className="btn btn-ghost"
                onClick={() => { setSelectedAnswer(null); setChecked(false); setShowSolution(false); }}
              >
                🔄 Try Again
              </button>
            )}
          </div>
        </div>

        {/* Solution */}
        {(showSolution || checked) && currentQ.solutionMd && (
          <div className="solution-panel">
            <div
              className="solution-header"
              onClick={() => setShowSolution(v => !v)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setShowSolution(v => !v)}
              aria-expanded={showSolution}
            >
              <h4>📋 Step-by-Step Solution</h4>
              <span style={{ fontSize: '0.8rem', color: '#15803d' }}>{showSolution ? '▲ Hide' : '▼ Show'}</span>
            </div>
            {showSolution && (
              <div
                className="solution-body question-text"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(currentQ.solutionMd) }}
              />
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-ghost" onClick={() => goTo(currentIdx - 1)} disabled={currentIdx === 0}>
          ← Previous
        </button>

        {/* Quick jump */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {pack.questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => goTo(i)}
              style={{
                width: 30, height: 30, borderRadius: 6, border: 'none',
                cursor: 'pointer',
                fontWeight: 700, fontSize: '0.7rem',
                background: i === currentIdx ? 'var(--primary)' : 'var(--border)',
                color: i === currentIdx ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.12s ease',
              }}
              aria-label={`Go to question ${i + 1}`}
              aria-current={i === currentIdx}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button className="btn btn-primary" onClick={() => goTo(currentIdx + 1)} disabled={currentIdx >= pack.questions.length - 1}>
          Next →
        </button>
      </div>
    </div>
  );
}
