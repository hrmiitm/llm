import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AttemptResult } from '../../types';
import { loadAllResults } from '../../storage/db';

export function HistoryPage() {
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllResults().then(r => { setResults(r); setLoading(false); });
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner"/></div>;

  return (
    <div className="page-history">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.25rem' }}>Attempt History</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {results.length} completed exam{results.length !== 1 ? 's' : ''} · stored locally on your device
          </p>
        </div>
        <Link to="/" className="btn btn-outline btn-sm">← Back to Home</Link>
      </div>

      {results.length === 0 ? (
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>No attempts yet</h3>
          <p>Complete an exam to see your history here.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1.25rem', display: 'inline-flex' }}>
            Browse Assignments
          </Link>
        </div>
      ) : (
        <div>
          {results.map(r => {
            const pct = r.totalQuestions > 0 ? Math.round((r.correct / r.totalQuestions) * 100) : 0;
            const scoreColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
            return (
              <div key={r.attemptId} className="history-item">
                <div style={{
                  width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `color-mix(in srgb, ${scoreColor} 15%, transparent)`,
                  border: `2px solid ${scoreColor}`,
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: scoreColor,
                  flexShrink: 0,
                }}>
                  {pct}%
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.15rem' }}>
                    {r.gaId.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {r.correct}/{r.totalQuestions} correct · {new Date(r.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <Link to={`/results/${r.attemptId}`} state={{ result: r }} className="btn btn-outline btn-sm">
                    View Results
                  </Link>
                  <Link to={`/exam/${r.gaId}`} className="btn btn-primary btn-sm">
                    Retake
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#1e40af' }}>
        🔒 All attempt data is stored only in your browser's IndexedDB. Clearing browser data will remove your history.
      </div>
    </div>
  );
}
