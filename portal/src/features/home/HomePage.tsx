import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { GACatalogItem } from '../../types';
import { fetchCatalog } from '../../lib/content';
import { loadActiveAttemptForGA } from '../../storage/db';

export function HomePage() {
  const [catalog, setCatalog] = useState<GACatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAttempts, setActiveAttempts] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchCatalog()
      .then(async (cat) => {
        setCatalog(cat);
        // Check for active attempts
        const active: Record<string, boolean> = {};
        for (const item of cat) {
          const a = await loadActiveAttemptForGA(item.id);
          if (a) active[item.id] = true;
        }
        setActiveAttempts(active);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalScore = catalog.reduce((s, c) => s + (c.score ?? 0), 0);
  const totalMax   = catalog.reduce((s, c) => s + (c.maxScore ?? 100), 0);
  const avgScore   = catalog.length > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  if (loading) return (
    <div className="page-home">
      <div className="loading-center">
        <div className="spinner" />
        <p>Loading assignments…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="page-home">
      <div className="error-box">
        <p>⚠️ {error}</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
          Make sure to run <code>npm run compile</code> first.
        </p>
      </div>
    </div>
  );

  return (
    <div className="page-home">
      {/* Hero */}
      <div className="home-hero">
        <div className="hero-kicker">Candidate dashboard <span>•</span> Large Language Models</div>
        <h2>Prepare like the real test.</h2>
        <p>NPTEL · IIT Madras — take timed computer-based exams, practise with instant feedback, or create a custom test from any available assignment.</p>
        <div className="hero-actions">
          <Link to="/custom" className="btn btn-accent">＋ Create Custom Test</Link>
          <a href="#assignments" className="btn btn-hero-ghost">Browse Assignments</a>
        </div>
        <div className="home-stats">
          <div className="stat-item">
            <span className="stat-value">{catalog.length}</span>
            <span className="stat-label">Assignments</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{catalog.reduce((s, c) => s + c.questionCount, 0)}</span>
            <span className="stat-label">Questions</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{avgScore}%</span>
            <span className="stat-label">Avg Score</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{ color: '#4ade80' }}>
              {catalog.filter(c => c.score === c.maxScore).length}
            </span>
            <span className="stat-label">Perfect Scores</span>
          </div>
        </div>
      </div>

      {/* Continue Banner */}
      {Object.keys(activeAttempts).length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fffbeb, #fef9c3)',
          border: '1px solid #fde68a',
          borderLeft: '4px solid #f59e0b',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>📂 Resume In-Progress Exam</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              You have {Object.keys(activeAttempts).length} unfinished exam session(s).
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.keys(activeAttempts).map(gaId => (
              <button key={gaId} onClick={() => navigate(`/exam/${gaId}`)} className="btn btn-accent btn-sm">
                Resume {gaId.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GA Grid */}
      <div id="assignments" className="home-section-heading">
        <div>
          <div className="section-eyebrow">Available question papers</div>
          <div className="section-title">All Assignments</div>
        </div>
        <span className="home-section-note">Select an assignment to begin</span>
      </div>
      <div className="ga-grid">
        {catalog.map(ga => (
          <GaCard key={ga.id} ga={ga} hasActiveAttempt={activeAttempts[ga.id]} />
        ))}
      </div>
    </div>
  );
}

function GaCard({ ga, hasActiveAttempt }: { ga: GACatalogItem; hasActiveAttempt?: boolean }) {
  const isPerfect = ga.score !== null && ga.score === ga.maxScore;
  const scoreText = ga.score !== null ? `${ga.score} / ${ga.maxScore ?? 100}` : null;

  return (
    <div className="ga-card">
      <div className="ga-card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
            <span className="ga-week-badge">Week {ga.week}</span>
            {scoreText && (
              <span className="ga-score-badge" style={{ background: isPerfect ? '#15803d' : 'var(--accent)' }}>
                {isPerfect ? '✓ ' : ''}{scoreText}
              </span>
            )}
            {hasActiveAttempt && (
              <span className="ga-score-badge" style={{ background: '#f59e0b' }}>⏸ In Progress</span>
            )}
          </div>
          <div className="ga-card-title">GA {ga.week < 10 ? ga.week : ga.week} — {ga.title.split('—')[1]?.trim() || 'Graded Assignment'}</div>
        </div>
      </div>

      <div className="ga-card-body">
        <div className="ga-topics">
          {ga.topics.slice(0, 4).map(t => (
            <span key={t} className="topic-tag">{t}</span>
          ))}
          {ga.topics.length > 4 && <span className="topic-tag">+{ga.topics.length - 4}</span>}
        </div>

        <div className="ga-meta">
          <span>❓ {ga.questionCount} questions</span>
          <span>⏱ {ga.durationMinutes} min</span>
          {ga.submittedDate && <span>📅 {ga.submittedDate}</span>}
        </div>
      </div>

      <div className="ga-card-actions">
        <Link to={`/exam/${ga.id}`} className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
          {hasActiveAttempt ? '▶ Resume Exam' : '🎯 Start Exam'}
        </Link>
        <Link to={`/practice/${ga.id}`} className="btn btn-outline btn-sm" style={{ flex: 1, textAlign: 'center' }}>
          📖 Practice
        </Link>
      </div>
    </div>
  );
}
