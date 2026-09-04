import type { Question } from '../types';

interface Props {
  questions: Question[];
  answers: Record<string, string | string[] | null>;
  checked: Record<string, boolean>;
  currentIndex: number;
  onNavigate: (index: number) => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function PracticePalette({ questions, answers, checked, currentIndex, onNavigate, mobileOpen, onClose }: Props) {
  const attempted = questions.filter(question => {
    const answer = answers[question.id];
    return answer !== null && answer !== undefined && (typeof answer === 'string' ? answer.trim() !== '' : answer.length > 0);
  }).length;
  const completed = questions.filter(question => checked[question.id]).length;

  return (
    <aside className={`palette-pane ${mobileOpen ? 'mobile-open' : ''}`} role="complementary" aria-label="Practice question palette">
      {onClose && <button onClick={onClose} className="btn btn-ghost btn-sm mobile-only palette-close" aria-label="Close palette">✕ Close</button>}
      <div className="palette-pane-header">
        <span>Question Palette</span>
        <small>Practice</small>
      </div>
      <div className="palette-pane-scroll">
        <div className="palette-progress-card">
          <div><strong>{completed}</strong><span> checked</span></div>
          <div><strong>{attempted}</strong><span> attempted</span></div>
        </div>
        <div className="palette-grid">
          {questions.map((question, index) => {
            const answer = answers[question.id];
            const hasAnswer = answer !== null && answer !== undefined && (typeof answer === 'string' ? answer.trim() !== '' : answer.length > 0);
            const state = checked[question.id] ? 'answered' : hasAnswer ? 'marked' : 'not_visited';
            return (
              <button
                key={question.id}
                className={`palette-btn ${index === currentIndex ? 'active' : ''}`}
                data-state={state}
                onClick={() => { onNavigate(index); onClose?.(); }}
                aria-label={`Question ${index + 1}: ${checked[question.id] ? 'Checked' : hasAnswer ? 'Attempted' : 'Not attempted'}`}
                aria-current={index === currentIndex ? 'true' : undefined}
                title={`Question ${index + 1}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <div className="palette-legend">
          <div className="legend-title">Practice status</div>
          <div className="legend-items">
            <div className="legend-item"><div className="legend-dot current" aria-hidden="true" /><span>Current</span></div>
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--palette-answered)' }} aria-hidden="true" /><span>Checked</span></div>
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--palette-marked)' }} aria-hidden="true" /><span>Attempted</span></div>
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--palette-not-visited)' }} aria-hidden="true" /><span>Not attempted</span></div>
          </div>
        </div>
      </div>
    </aside>
  );
}
