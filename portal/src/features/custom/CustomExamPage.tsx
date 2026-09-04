import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { GACatalogItem, GAPack } from '../../types';
import { fetchCatalog, fetchPack, saveCustomPack } from '../../lib/content';

type PoolMode = 'random' | 'selected';

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function CustomExamPage() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<GACatalogItem[]>([]);
  const [poolMode, setPoolMode] = useState<PoolMode>('random');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(20);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalog()
      .then(items => {
        setCatalog(items);
        setSelectedIds(items.map(item => item.id));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const availableCount = useMemo(() => {
    if (poolMode === 'random') return catalog.reduce((total, item) => total + item.questionCount, 0);
    return catalog
      .filter(item => selectedIds.includes(item.id))
      .reduce((total, item) => total + item.questionCount, 0);
  }, [catalog, poolMode, selectedIds]);

  const effectiveCount = Math.min(Math.max(1, questionCount || 1), availableCount || 1);
  const effectiveDuration = Math.min(240, Math.max(5, Number.isFinite(durationMinutes) ? durationMinutes : 5));
  const selectedExamCount = poolMode === 'random' ? catalog.length : selectedIds.length;

  const toggleExam = (id: string) => {
    setSelectedIds(current => current.includes(id)
      ? current.filter(selectedId => selectedId !== id)
      : [...current, id]);
  };

  async function startCustom(mode: 'exam' | 'practice') {
    if (!availableCount || !catalog.length || (poolMode === 'selected' && selectedIds.length === 0)) return;
    setStarting(true);
    setError(null);
    try {
      const sourceItems = poolMode === 'random' ? catalog : catalog.filter(item => selectedIds.includes(item.id));
      const packs = await Promise.all(sourceItems.map(item => fetchPack(item.id)));
      const pool = packs.flatMap(pack => pack.questions.map(question => ({
        ...question,
        id: `${pack.id}__${question.id}`,
        num: `${pack.id.toUpperCase()} · ${question.num}`,
      })));
      const questions = shuffle(pool).slice(0, effectiveCount);
      const customId = `custom-${crypto.randomUUID().slice(0, 8)}`;
      const topics = [...new Set(sourceItems.flatMap(item => item.topics))].slice(0, 8);
      const pack: GAPack = {
        id: customId,
        week: 0,
        title: poolMode === 'random' ? 'Custom Test — All Available Exams' : `Custom Test — ${selectedExamCount} Selected Exams`,
        topics,
        score: null,
        maxScore: questions.reduce((total, question) => total + question.marks.correct, 0),
        submittedDate: null,
        questionCount: questions.length,
        durationMinutes: effectiveDuration,
        questions,
      };
      saveCustomPack(pack);
      navigate(`/${mode}/${customId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create custom test');
      setStarting(false);
    }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /><p>Loading available exams…</p></div>;
  if (error && !catalog.length) return <div className="error-box">⚠️ {error}</div>;

  return (
    <div className="custom-page">
      <div className="custom-breadcrumb"><Link to="/">Home</Link><span>/</span><span>Custom Test</span></div>

      <div className="custom-heading">
        <div>
          <div className="section-eyebrow">Test configuration</div>
          <h2>Build your own test</h2>
          <p>Choose the question pool and size, then practise or take it in the same computer-based format.</p>
        </div>
        <div className="custom-heading-mark" aria-hidden="true"><span>CBT</span><strong>+</strong></div>
      </div>

      <div className="custom-layout">
        <main className="custom-form-card">
          <div className="custom-card-title"><span className="step-number">1</span><div><h3>Choose question pool</h3><p>Decide where your questions should come from.</p></div></div>
          <div className="choice-grid">
            <label className={`choice-card ${poolMode === 'random' ? 'selected' : ''}`}>
              <input type="radio" name="pool" checked={poolMode === 'random'} onChange={() => setPoolMode('random')} />
              <span className="choice-icon">✦</span>
              <span><strong>Random from all exams</strong><small>Draw questions from the full available question bank.</small></span>
            </label>
            <label className={`choice-card ${poolMode === 'selected' ? 'selected' : ''}`}>
              <input type="radio" name="pool" checked={poolMode === 'selected'} onChange={() => setPoolMode('selected')} />
              <span className="choice-icon">☷</span>
              <span><strong>Only selected exams</strong><small>Focus your test on one or more assignments.</small></span>
            </label>
          </div>

          {poolMode === 'selected' && (
            <div className="exam-picker">
              <div className="field-label-row"><label>Available exam papers</label><span>{selectedIds.length} selected</span></div>
              <div className="exam-picker-grid">
                {catalog.map(item => (
                  <label key={item.id} className={`exam-picker-item ${selectedIds.includes(item.id) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleExam(item.id)} />
                    <span className="exam-picker-check">{selectedIds.includes(item.id) ? '✓' : ''}</span>
                    <span><strong>Week {item.week}</strong><small>{item.title.split('—')[1]?.trim() || item.title}</small></span>
                    <em>{item.questionCount} Q</em>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="custom-divider" />
          <div className="custom-card-title"><span className="step-number">2</span><div><h3>Set test size and time</h3><p>Questions are shuffled for every new custom test.</p></div></div>
          <div className="custom-fields">
            <div className="field-group">
              <label htmlFor="question-count">Number of questions</label>
              <div className="number-input-wrap"><input id="question-count" type="number" min="1" max={availableCount || 1} value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} /><span>questions</span></div>
              <div className="quick-counts">
                {[10, 20, 30, availableCount].filter((value, index, values) => value > 0 && values.indexOf(value) === index).map(value => (
                  <button key={value} type="button" className={effectiveCount === value ? 'active' : ''} onClick={() => setQuestionCount(value)}>{value === availableCount ? 'All' : value}</button>
                ))}
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="duration">Time limit</label>
              <div className="number-input-wrap"><input id="duration" type="number" min="5" max="240" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} /><span>minutes</span></div>
              <small className="field-hint">About {Math.max(1, Math.round(effectiveDuration / effectiveCount * 10) / 10)} min per question</small>
            </div>
          </div>

          {error && <div className="inline-error">⚠️ {error}</div>}
          <div className="custom-actions">
            <button className="btn btn-primary btn-lg" onClick={() => startCustom('exam')} disabled={starting || !availableCount || (poolMode === 'selected' && selectedIds.length === 0)}>{starting ? 'Creating test…' : 'Start Timed Test →'}</button>
            <button className="btn btn-outline" onClick={() => startCustom('practice')} disabled={starting || !availableCount || (poolMode === 'selected' && selectedIds.length === 0)}>Practice this set</button>
          </div>
        </main>

        <aside className="custom-summary-card">
          <div className="summary-label">Your test preview</div>
          <div className="summary-icon">◈</div>
          <h3>{poolMode === 'random' ? 'All available exams' : `${selectedExamCount} selected exam${selectedExamCount === 1 ? '' : 's'}`}</h3>
          <p>Questions will be randomly selected and ordered when you start.</p>
          <div className="summary-stats">
            <div><strong>{effectiveCount}</strong><span>Questions</span></div>
            <div><strong>{effectiveDuration}</strong><span>Minutes</span></div>
            <div><strong>{availableCount}</strong><span>In pool</span></div>
          </div>
          <div className="summary-note"><span>✓</span><p>Answers auto-save during a timed test. You can resume if you leave the page.</p></div>
        </aside>
      </div>
    </div>
  );
}
