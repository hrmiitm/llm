import type { AttemptState, GAPack, QuestionState } from '../types';

interface Props {
  pack: GAPack;
  attempt: AttemptState;
  currentIndex: number;
  onNavigate: (index: number) => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

const STATE_LABELS: Record<string, string> = {
  not_visited:    'Not Visited',
  not_answered:   'Not Answered',
  answered:       'Answered',
  marked:         'Marked for Review',
  answered_marked:'Answered & Marked',
};

export function Palette({ pack, attempt, currentIndex, onNavigate, mobileOpen, onClose }: Props) {
  const counts: Record<string, number> = {
    not_visited: 0, not_answered: 0, answered: 0, marked: 0, answered_marked: 0,
  };
  for (const qs of Object.values(attempt.questions) as QuestionState[]) {
    counts[qs.paletteState]++;
  }

  return (
    <div className={`palette-pane ${mobileOpen ? 'mobile-open' : ''}`} role="complementary" aria-label="Question palette">
      {/* Mobile close button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{ display: 'flex' }}
          className="btn btn-ghost btn-sm mobile-only"
          aria-label="Close palette"
        >
          ✕ Close
        </button>
      )}

      <div className="palette-pane-header">
        Question Palette
      </div>

      <div className="palette-pane-scroll">
        {/* Counts summary */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.875rem' }}>
          {Object.entries(counts).filter(([,v]) => v > 0).map(([state, count]) => (
            <span
              key={state}
              style={{ fontSize: '0.7rem', background: 'var(--surface)', padding: '0.15rem 0.5rem', borderRadius: '12px', color: 'var(--text-secondary)' }}
            >
              {count} {STATE_LABELS[state]?.split(' ')[0]}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="palette-grid">
          {pack.questions.map((q: GAPack['questions'][number], i: number) => {
            const qs = attempt.questions[q.id];
            const state = qs?.paletteState ?? 'not_visited';
            return (
              <button
                key={q.id}
                className={`palette-btn ${i === currentIndex ? 'active' : ''}`}
                data-state={state}
                onClick={() => { onNavigate(i); onClose?.(); }}
                aria-label={`Question ${i + 1}: ${STATE_LABELS[state]}`}
                aria-current={i === currentIndex ? 'true' : undefined}
                title={`Q${i + 1} — ${STATE_LABELS[state]}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="palette-legend">
          <div className="legend-title">Legend</div>
          <div className="legend-items">
            {[
              { state: 'not_visited',    color: 'var(--palette-not-visited)',  label: 'Not Visited' },
              { state: 'not_answered',   color: 'var(--palette-not-answered)', label: 'Not Answered' },
              { state: 'answered',       color: 'var(--palette-answered)',      label: 'Answered' },
              { state: 'marked',         color: 'var(--palette-marked)',        label: 'Marked for Review' },
              { state: 'answered_marked',color: 'var(--palette-ans-marked)',    label: 'Answered + Marked' },
            ].map(({ state, color, label }) => (
              <div key={state} className="legend-item">
                <div className="legend-dot" style={{ background: color }} aria-hidden="true" />
                <span>{label}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '0.7rem' }}>
                  {counts[state as keyof typeof counts] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
