import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { GAPack } from '../../types';
import { fetchPack } from '../../lib/content';
import { QuestionRenderer } from '../../components/QuestionRenderer';
import { PracticePalette } from '../../components/PracticePalette';
import { renderMarkdown } from '../../lib/renderer';

type Answer = string | string[] | null;

function hasAnswer(answer: Answer | undefined) {
  return answer !== null && answer !== undefined && (typeof answer === 'string' ? answer.trim() !== '' : answer.length > 0);
}

function isCorrectAnswer(pack: GAPack, questionId: string, selected: Answer) {
  const question = pack.questions.find(item => item.id === questionId);
  if (!question?.answer || !hasAnswer(selected)) return false;
  const correct = (Array.isArray(question.answer.value) ? question.answer.value : [question.answer.value]).map(String).map(value => value.toUpperCase());
  const submitted = (Array.isArray(selected) ? selected : [selected]).map(String).map(value => value.toUpperCase());
  if (question.type === 'multiple_select') return correct.sort().join(',') === submitted.sort().join(',');
  if (question.type === 'numeric') {
    const answer = Number(submitted[0]);
    const expected = Number(correct[0].replace(/[,{}]/g, ''));
    return Number.isFinite(answer) && Number.isFinite(expected) && Math.abs(answer - expected) <= Math.max(Math.abs(expected) * 0.01, 0.5);
  }
  return correct[0] === submitted[0];
}

export function PracticePage() {
  const { gaId } = useParams<{ gaId: string }>();
  const [pack, setPack] = useState<GAPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [showSolution, setShowSolution] = useState(false);
  const [showPaletteMobile, setShowPaletteMobile] = useState(false);

  useEffect(() => {
    if (!gaId) return;
    fetchPack(gaId)
      .then(setPack)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [gaId]);

  const goTo = (idx: number) => {
    if (!pack) return;
    setShowSolution(false);
    setCurrentIdx(Math.min(Math.max(0, idx), pack.questions.length - 1));
  };

  if (loading) return <div className="loading-center"><div className="spinner" /><p>Loading practice set…</p></div>;
  if (error || !pack) return <div className="error-box">⚠️ {error || 'Failed to load practice set'}</div>;

  const currentQ = pack.questions[currentIdx];
  if (!currentQ) return null;

  const selectedAnswer = answers[currentQ.id] ?? null;
  const checked = Boolean(checkedQuestions[currentQ.id]);
  const attemptedCount = Object.values(answers).filter(hasAnswer).length;
  const correct = isCorrectAnswer(pack, currentQ.id, selectedAnswer);
  const progress = ((currentIdx + 1) / pack.questions.length) * 100;

  const updateAnswer = (value: Answer) => {
    setAnswers(current => ({ ...current, [currentQ.id]: value }));
    setCheckedQuestions(current => ({ ...current, [currentQ.id]: false }));
    setShowSolution(false);
  };

  const checkAnswer = () => {
    if (!hasAnswer(selectedAnswer)) return;
    setCheckedQuestions(current => ({ ...current, [currentQ.id]: true }));
  };

  const clearResponse = () => updateAnswer(null);

  return (
    <div className="exam-shell practice-shell-cbt">
      <header className="exam-header practice-header">
        <Link to="/" className="exam-brand" aria-label="Back to home">
          <span className="exam-brand-mark">LLM</span>
          <span className="exam-brand-copy"><strong>Practice Console</strong><small>{pack.title}</small></span>
        </Link>
        <div className="exam-session-meta">
          <span className="session-label">Mode</span>
          <strong>Practice</strong>
          <span className="session-divider" />
          <span><strong>{attemptedCount}</strong> attempted</span>
        </div>
        <button className="btn btn-ghost btn-sm mobile-palette-toggle" onClick={() => setShowPaletteMobile(value => !value)} aria-label="Toggle practice question palette">☰ Palette</button>
        <Link to="/" className="btn btn-ghost btn-sm exam-exit">Exit Practice</Link>
      </header>

      <div className="exam-subheader">
        <div><span className="subheader-label">Question paper</span><strong>{pack.title}</strong></div>
        <div className="practice-subheader-progress"><span>Progress</span><strong>{currentIdx + 1} of {pack.questions.length}</strong><div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${progress}%` }} /></div></div>
      </div>

      <div className="exam-body">
        <main className="question-pane">
          <div className="question-pane-header">
            <div className="question-number-badge">{currentIdx + 1}</div>
            <div className="question-heading-copy"><span>Question {currentIdx + 1} of {pack.questions.length}</span><strong>{currentQ.title || currentQ.num}</strong></div>
            <span className="question-type-badge">{currentQ.type.replace('_', ' ')}</span>
            {checked && <span className="practice-checked-badge">✓ Checked</span>}
          </div>

          <div className="question-pane-scroll">
            <div className="practice-instruction"><span>Practice mode</span><p>Submit an answer to see instant feedback. You can try again at any time.</p></div>
            <QuestionRenderer question={currentQ} selectedAnswer={selectedAnswer} onAnswer={updateAnswer} showCorrect={checked} disabled={checked} />

            {checked && (
              <div className={`practice-feedback ${correct ? 'correct' : 'incorrect'}`}>
                <strong>{correct ? 'Correct answer' : 'Not quite'}</strong>
                <span>{correct ? 'Nice work. Review the explanation below if you want to go deeper.' : 'The correct answer is highlighted below. Try again or review the solution.'}</span>
              </div>
            )}

            <div className="practice-action-row">
              {!checked ? (
                <>
                  <button className="btn btn-primary" onClick={checkAnswer} disabled={!hasAnswer(selectedAnswer)}>✓ Check Answer</button>
                  <button className="btn btn-outline" onClick={() => { setCheckedQuestions(current => ({ ...current, [currentQ.id]: true })); setShowSolution(true); }}>⌁ Show Solution</button>
                </>
              ) : (
                <button className="btn btn-ghost" onClick={() => { setCheckedQuestions(current => ({ ...current, [currentQ.id]: false })); setShowSolution(false); }}>↻ Try Again</button>
              )}
              <button className="btn btn-ghost" onClick={clearResponse} disabled={!hasAnswer(selectedAnswer)}>× Clear Response</button>
            </div>

            {checked && currentQ.solutionMd && (
              <div className="solution-panel">
                <button className="solution-header" onClick={() => setShowSolution(value => !value)} aria-expanded={showSolution}>
                  <h4>⌁ Step-by-Step Solution</h4><span>{showSolution ? 'Hide ▲' : 'Show ▼'}</span>
                </button>
                {showSolution && <div className="solution-body question-text" dangerouslySetInnerHTML={{ __html: renderMarkdown(currentQ.solutionMd) }} />}
              </div>
            )}
          </div>

          <div className="exam-footer">
            <button className="btn btn-ghost btn-sm" onClick={() => goTo(currentIdx - 1)} disabled={currentIdx === 0}>← Previous</button>
            <div className="spacer" />
            <span className="footer-progress">{currentIdx + 1} / {pack.questions.length}</span>
            <button className="btn btn-primary btn-sm" onClick={() => goTo(currentIdx + 1)} disabled={currentIdx >= pack.questions.length - 1}>Save &amp; Next →</button>
          </div>
        </main>

        <PracticePalette questions={pack.questions} answers={answers} checked={checkedQuestions} currentIndex={currentIdx} onNavigate={goTo} mobileOpen={showPaletteMobile} onClose={() => setShowPaletteMobile(false)} />
        {showPaletteMobile && <div className="palette-mobile-backdrop" onClick={() => setShowPaletteMobile(false)} aria-hidden="true" />}
      </div>
    </div>
  );
}
