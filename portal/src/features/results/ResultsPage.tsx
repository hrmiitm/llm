import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import type { AttemptResult, GAPack, PerQuestionResult } from '../../types';
import { fetchPack } from '../../lib/content';
import { loadResult } from '../../storage/db';
import { renderMarkdown } from '../../lib/renderer';

export function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const location = useLocation();
  const [result, setResult] = useState<AttemptResult | null>(location.state?.result ?? null);
  const [pack, setPack] = useState<GAPack | null>(null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');

  useEffect(() => {
    if (!result && attemptId) {
      loadResult(attemptId).then(r => {
        if (r) setResult(r);
        setLoading(false);
      });
    }
  }, [attemptId, result]);

  useEffect(() => {
    if (result?.gaId) {
      fetchPack(result.gaId).then(setPack).catch(() => {});
    }
  }, [result?.gaId]);

  if (loading) return <div className="loading-center"><div className="spinner"/><p>Loading results…</p></div>;
  if (!result) return <div className="error-box">Results not found. They may have been cleared.</div>;

  const gaTitle = location.state?.gaTitle ?? pack?.title ?? result.gaId;
  const pct = result.totalQuestions > 0 ? Math.round((result.correct / result.totalQuestions) * 100) : 0;
  const scoreColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

  const filtered = result.perQuestion.filter(pq => {
    if (filter === 'correct') return pq.isCorrect;
    if (filter === 'incorrect') return !pq.isCorrect && pq.submittedAnswer !== null;
    if (filter === 'unattempted') return pq.submittedAnswer === null;
    return true;
  });

  return (
    <div className="page-results">
      {/* Hero */}
      <div className="result-hero">
        <div style={{ marginBottom: '0.5rem', opacity: 0.8, fontSize: '0.875rem' }}>
          {gaTitle}
        </div>
        <h2>Exam Results</h2>
        <div className="result-score-display">
          <span className="result-score-big" style={{ color: scoreColor }}>
            {result.correct}
          </span>
          <span className="result-score-max">/ {result.totalQuestions}</span>
        </div>
        <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>
          Accuracy: {pct}% · Completed: {new Date(result.completedAt).toLocaleString()}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
          <Link to={`/exam/${result.gaId}`} className="btn btn-accent">🔄 Retake Exam</Link>
          <Link to={`/practice/${result.gaId}`} className="btn btn-ghost" style={{ color: 'white', borderColor: 'rgba(255,255,255,.4)' }}>📖 Practice Mode</Link>
          <Link to="/" className="btn btn-ghost" style={{ color: 'white', borderColor: 'rgba(255,255,255,.4)' }}>← Home</Link>
        </div>
      </div>

      {/* Breakdown */}
      <div className="result-breakdown">
        <div className="breakdown-card correct">
          <div className="value">{result.correct}</div>
          <div className="label">Correct</div>
        </div>
        <div className="breakdown-card incorrect">
          <div className="value">{result.incorrect}</div>
          <div className="label">Incorrect</div>
        </div>
        <div className="breakdown-card unattempted">
          <div className="value">{result.unattempted}</div>
          <div className="label">Unattempted</div>
        </div>
        <div className="breakdown-card accuracy">
          <div className="value">{pct}%</div>
          <div className="label">Accuracy</div>
        </div>
      </div>

      {/* Review */}
      <div className="section-title">Question-by-Question Review</div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {(['all', 'correct', 'incorrect', 'unattempted'] as const).map(f => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && ` (${f === 'correct' ? result.correct : f === 'incorrect' ? result.incorrect : result.unattempted})`}
          </button>
        ))}
      </div>

      <div className="review-list">
        {filtered.map(pq => (
          <ReviewItem
            key={pq.questionId}
            pq={pq}
            pack={pack}
            expanded={expandedQ === pq.questionId}
            onToggle={() => setExpandedQ(expandedQ === pq.questionId ? null : pq.questionId)}
          />
        ))}
      </div>
    </div>
  );
}

function ReviewItem({
  pq, pack, expanded, onToggle,
}: {
  pq: PerQuestionResult;
  pack: GAPack | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  const q = pack?.questions.find(q => q.id === pq.questionId);
  const [showSolution, setShowSolution] = useState(false);

  const statusClass = pq.submittedAnswer === null ? 'unattempted' : pq.isCorrect ? 'correct' : 'incorrect';
  const statusText = pq.submittedAnswer === null ? 'Unattempted' : pq.isCorrect ? 'Correct ✓' : 'Incorrect ✗';
  const statusColor = pq.submittedAnswer === null ? '#9ca3af' : pq.isCorrect ? '#22c55e' : '#ef4444';

  const formatAnswer = (val: string | string[] | null) => {
    if (!val) return '—';
    return Array.isArray(val) ? val.join(', ') : val;
  };

  return (
    <div className="review-item">
      <div
        className="review-item-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onToggle()}
        aria-expanded={expanded}
      >
        <div className={`review-status-dot ${statusClass}`} aria-hidden="true" />
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {pq.num}
            {q && ` — ${q.title}`}
          </span>
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: statusColor }}>
          {statusText}
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
          {pq.marksAwarded}/{pq.maxMarks} marks
        </span>
        <span style={{ color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && q && (
        <div className="review-item-body">
          {/* Question */}
          <div className="question-text" style={{ marginBottom: '1rem' }}>
            <div
              dangerouslySetInnerHTML={{ __html: renderMarkdown(q.bodyMd) }}
            />
          </div>

          {/* Answer comparison */}
          <div className="answer-comparison">
            <div className={`answer-box your-answer ${!pq.isCorrect && pq.submittedAnswer ? 'wrong' : ''}`}>
              <div className="label">Your Answer</div>
              <div style={{ fontWeight: 600 }}>{formatAnswer(pq.submittedAnswer)}</div>
            </div>
            <div className="answer-box correct-answer">
              <div className="label">Correct Answer</div>
              <div style={{ fontWeight: 600 }}>
                {pq.correctAnswer ? formatAnswer(
                  Array.isArray(pq.correctAnswer.value) ? pq.correctAnswer.value : String(pq.correctAnswer.value)
                ) : '—'}
              </div>
            </div>
          </div>

          {/* Solution */}
          {q.solutionMd && (
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
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(q.solutionMd) }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
