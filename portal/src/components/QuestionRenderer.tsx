import { renderMarkdown, renderInlineText } from '../lib/renderer';
import type { Question, QuestionOption } from '../types';

interface Props {
  question: Question;
  selectedAnswer: string | string[] | null;
  onAnswer: (val: string | string[] | null) => void;
  showCorrect?: boolean;
  disabled?: boolean;
}

export function QuestionRenderer({ question, selectedAnswer, onAnswer, showCorrect, disabled }: Props) {
  const { type, context, bodyMd, options, answer } = question;

  // Determine which options are correct (for review mode)
  const correctOptions = showCorrect && answer
    ? (Array.isArray(answer.value) ? answer.value : [answer.value]).map((v: unknown) => String(v).toUpperCase())
    : [];

  const selected = Array.isArray(selectedAnswer) ? selectedAnswer : (selectedAnswer ? [selectedAnswer] : []);

  function handleSingleChoice(optId: string) {
    if (disabled) return;
    onAnswer(selected[0] === optId ? null : optId);
  }

  function handleMultiSelect(optId: string) {
    if (disabled) return;
    const newSel = selected.includes(optId)
      ? selected.filter(s => s !== optId)
      : [...selected, optId];
    onAnswer(newSel.length > 0 ? newSel : null);
  }

  function getOptionClass(opt: QuestionOption) {
    const isSelected = selected.includes(opt.id);
    const isCorrect = correctOptions.includes(opt.id.toUpperCase());
    const isIncorrect = isSelected && showCorrect && !isCorrect;
    return [
      'option-item',
      isSelected ? 'selected' : '',
      showCorrect && isCorrect ? 'correct' : '',
      isIncorrect ? 'incorrect' : '',
    ].filter(Boolean).join(' ');
  }

  return (
    <div className="question-content">
      {/* Context block */}
      {context && (
        <div className="question-context">
          <div className="context-label">📋 Context for this question</div>
          <div
            className="question-text"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(context) }}
          />
        </div>
      )}

      {/* Question body */}
      <div
        className="question-text"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(bodyMd) }}
      />

      {/* Options */}
      {type === 'single_choice' && (
        <div className="options-list" role="radiogroup">
          {options.map(opt => (
            <label key={opt.id} className={getOptionClass(opt)}>
              <input
                type="radio"
                name={`q-${question.id}`}
                value={opt.id}
                checked={selected.includes(opt.id)}
                onChange={() => handleSingleChoice(opt.id)}
                disabled={disabled}
              />
              <span className="option-key">{opt.id}.</span>
              <span
                className="option-text"
                dangerouslySetInnerHTML={{ __html: renderInlineText(opt.text) }}
              />
            </label>
          ))}
        </div>
      )}

      {type === 'multiple_select' && (
        <div className="options-list">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Select all that apply
          </p>
          {options.map(opt => (
            <label key={opt.id} className={getOptionClass(opt)}>
              <input
                type="checkbox"
                value={opt.id}
                checked={selected.includes(opt.id)}
                onChange={() => handleMultiSelect(opt.id)}
                disabled={disabled}
              />
              <span className="option-key">{opt.id}.</span>
              <span
                className="option-text"
                dangerouslySetInnerHTML={{ __html: renderInlineText(opt.text) }}
              />
            </label>
          ))}
        </div>
      )}

      {type === 'numeric' && (
        <div className="numeric-input-area">
          <label htmlFor={`num-${question.id}`}>Your Answer</label>
          <input
            id={`num-${question.id}`}
            type="number"
            step="any"
            className="numeric-input"
            value={selected[0] ?? ''}
            onChange={e => onAnswer(e.target.value || null)}
            disabled={disabled}
            placeholder="Enter numeric value…"
          />
          {showCorrect && answer && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#15803d' }}>
              ✓ Correct answer: <strong>{String(answer.value)}</strong>
            </p>
          )}
        </div>
      )}

      {type === 'text' && (
        <div className="numeric-input-area">
          <label htmlFor={`text-${question.id}`}>Your Answer</label>
          <input
            id={`text-${question.id}`}
            type="text"
            className="numeric-input"
            value={selected[0] ?? ''}
            onChange={e => onAnswer(e.target.value || null)}
            disabled={disabled}
            placeholder="Enter your answer…"
          />
          {showCorrect && answer && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#15803d' }}>
              ✓ Correct answer: <strong>{String(answer.value)}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
