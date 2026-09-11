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

  const scoredCatalog = catalog.filter(item => item.score !== null && item.maxScore !== null);
  const totalScore = scoredCatalog.reduce((s, c) => s + (c.score ?? 0), 0);
  const totalMax   = scoredCatalog.reduce((s, c) => s + (c.maxScore ?? 0), 0);
  const avgScore   = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  const learningCatalog = catalog.filter(item => item.category === 'LEARNING');
  const gaCatalog = catalog.filter(item => item.category !== 'PYQ' && item.category !== 'LEARNING' && item.category !== 'CSD');
  const csdCatalog = catalog.filter(item => item.category === 'CSD');
  const pyqCatalog = catalog.filter(item => item.category === 'PYQ');

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
        <div className="hero-kicker">Candidate dashboard <span>•</span> LLM & Computer System Design</div>
        <h2>Prepare like the real test.</h2>
        <p>NPTEL · IIT Madras — take timed computer-based exams, practise with instant feedback, or create a custom test from any available assignment.</p>
        <div className="hero-actions">
          <Link to="/visual-lab" className="btn btn-accent">Explore the Transformer Visual Lab</Link>
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

      {/* Learning Grid */}
      {learningCatalog.length > 0 && <CatalogSection
        id="learning"
        eyebrow="Guided learning path"
        title="Learning Assignments"
        note="Start with Learning 01 and progress in order"
        items={learningCatalog}
        activeAttempts={activeAttempts}
      />}

      {/* GA Grid */}
      <CatalogSection
        id="assignments"
        eyebrow="Available question papers"
        title="All Assignments"
        note="Select an assignment to begin"
        items={gaCatalog}
        activeAttempts={activeAttempts}
      />

      {csdCatalog.length > 0 && <CatalogSection
        id="csd"
        eyebrow="CSD · Previous year questions"
        title="Computer System Design"
        note="Two papers with worked solutions and source-key corrections"
        items={csdCatalog}
        activeAttempts={activeAttempts}
      />}

      {/* PYQ Grid */}
      {pyqCatalog.length > 0 && <CatalogSection
        id="pyq"
        eyebrow="Previous year questions"
        title="PYQ Papers"
        note="Practice the May 2026 papers"
        items={pyqCatalog}
        activeAttempts={activeAttempts}
      />}
    </div>
  );
}

function CatalogSection({
  id,
  eyebrow,
  title,
  note,
  items,
  activeAttempts,
}: {
  id: string;
  eyebrow: string;
  title: string;
  note: string;
  items: GACatalogItem[];
  activeAttempts: Record<string, boolean>;
}) {
  if (items.length === 0) return null;

  return (
    <section id={id}>
      <div className="home-section-heading">
        <div>
          <div className="section-eyebrow">{eyebrow}</div>
          <div className="section-title">{title}</div>
        </div>
        <span className="home-section-note">{note}</span>
      </div>
      <div className="ga-grid">
        {items.map(item => (
          <GaCard key={item.id} ga={item} hasActiveAttempt={activeAttempts[item.id]} />
        ))}
      </div>
    </section>
  );
}

function GaCard({ ga, hasActiveAttempt }: { ga: GACatalogItem; hasActiveAttempt?: boolean }) {
  const isCsd = ga.category === 'CSD';
  const isPyq = ga.category === 'PYQ';
  const isLearning = ga.category === 'LEARNING';
  const isPerfect = ga.score !== null && ga.score === ga.maxScore;
  const scoreText = ga.score !== null ? `${ga.score} / ${ga.maxScore ?? 100}` : null;

  return (
    <div className="ga-card">
      <div className="ga-card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
            <span className="ga-week-badge">{isCsd ? 'CSD · PYQ' : isLearning ? 'LEARNING' : isPyq ? 'PYQ' : `Week ${ga.week}`}</span>
            {scoreText && (
              <span className="ga-score-badge" style={{ background: isPerfect ? '#15803d' : 'var(--accent)' }}>
                {isPerfect ? '✓ ' : ''}{scoreText}
              </span>
            )}
            {hasActiveAttempt && (
              <span className="ga-score-badge" style={{ background: '#f59e0b' }}>⏸ In Progress</span>
            )}
          </div>
          <div className="ga-card-title">{isCsd || isLearning || isPyq ? (ga.label || ga.title) : `GA ${ga.week} — ${ga.title.split('—')[1]?.trim() || 'Graded Assignment'}`}</div>
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
