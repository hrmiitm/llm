import type { AttemptState, AttemptResult, GAPack, PerQuestionResult } from '../types';

export function scoreAttempt(attempt: AttemptState, pack: GAPack): AttemptResult {
  const perQuestion: PerQuestionResult[] = [];
  let correct = 0, incorrect = 0, unattempted = 0;
  let totalMarks = 0, maxMarks = 0;

  for (const q of pack.questions) {
    const qs = attempt.questions[q.id];
    const submittedAnswer = qs?.answer ?? null;
    const hasAnswer = submittedAnswer !== null &&
      (typeof submittedAnswer === 'string' ? submittedAnswer.trim() !== '' : submittedAnswer.length > 0);

    let isCorrect = false;

    if (!hasAnswer) {
      unattempted++;
    } else if (q.answer) {
      if (q.type === 'single_choice') {
        const submitted = Array.isArray(submittedAnswer) ? submittedAnswer[0] : submittedAnswer;
        const correct_ = Array.isArray(q.answer.value) ? q.answer.value[0] : q.answer.value;
        isCorrect = submitted?.toUpperCase() === correct_?.toUpperCase();
      } else if (q.type === 'multiple_select') {
        const submitted = (Array.isArray(submittedAnswer) ? submittedAnswer : [submittedAnswer])
          .map(s => s.toUpperCase()).sort().join(',');
        const correct_ = (Array.isArray(q.answer.value) ? q.answer.value : [q.answer.value])
          .map(s => s.toUpperCase()).sort().join(',');
        isCorrect = submitted === correct_;
      } else if (q.type === 'numeric') {
        const submitted = parseFloat(String(Array.isArray(submittedAnswer) ? submittedAnswer[0] : submittedAnswer));
        const correctVal = parseFloat(String(Array.isArray(q.answer.value) ? q.answer.value[0] : q.answer.value).replace(/[,{}]/g, ''));
        if (!isNaN(submitted) && !isNaN(correctVal)) {
          // 1% tolerance or ±0.5 whichever is larger
          const tol = Math.max(Math.abs(correctVal) * 0.01, 0.5);
          isCorrect = Math.abs(submitted - correctVal) <= tol;
        }
      } else {
        // boolean/text — text match
        const submitted = String(Array.isArray(submittedAnswer) ? submittedAnswer[0] : submittedAnswer).toLowerCase().trim();
        const correctVal = String(Array.isArray(q.answer.value) ? q.answer.value[0] : q.answer.value).toLowerCase().trim();
        isCorrect = submitted === correctVal || submitted.startsWith(correctVal.slice(0, 4));
      }

      if (isCorrect) correct++;
      else incorrect++;
    }

    const marksAwarded = !hasAnswer
      ? q.marks.unanswered
      : isCorrect
        ? q.marks.correct
        : q.marks.incorrect;

    maxMarks += q.marks.correct;
    totalMarks += marksAwarded;

    perQuestion.push({
      questionId: q.id,
      num: q.num,
      type: q.type,
      submittedAnswer,
      correctAnswer: q.answer,
      isCorrect,
      marksAwarded,
      maxMarks: q.marks.correct,
    });
  }

  return {
    attemptId: attempt.attemptId,
    gaId: attempt.gaId,
    completedAt: new Date().toISOString(),
    totalQuestions: pack.questions.length,
    correct,
    incorrect,
    unattempted,
    totalMarks,
    maxMarks,
    accuracyPercent: pack.questions.length > 0 ? Math.round((correct / pack.questions.length) * 100) : 0,
    perQuestion,
  };
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
