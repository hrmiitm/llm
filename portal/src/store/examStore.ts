import { create } from 'zustand';
import type { AttemptState, QuestionState, GAPack, AttemptResult } from '../types';
import { saveAttempt, saveResult, deleteAttempt } from '../storage/db';
import { scoreAttempt } from '../lib/scoring';

interface ExamStore {
  attempt: AttemptState | null;
  pack: GAPack | null;
  isLoading: boolean;

  // Actions
  startExam: (pack: GAPack, existingAttempt?: AttemptState) => void;
  setAnswer: (questionId: string, answer: string | string[] | null) => void;
  toggleMarkForReview: (questionId: string) => void;
  navigateTo: (index: number) => void;
  submitExam: () => AttemptResult | null;
  clearAnswer: (questionId: string) => void;
  tickTimer: () => void;
  reset: () => void;
}

function initQuestionStates(pack: GAPack): Record<string, QuestionState> {
  const states: Record<string, QuestionState> = {};
  for (const q of pack.questions) {
    states[q.id] = {
      paletteState: 'not_visited',
      answer: null,
      markedForReview: false,
      visited: false,
      timeSpentSeconds: 0,
    };
  }
  return states;
}

function computePaletteState(qs: QuestionState): QuestionState['paletteState'] {
  const hasAnswer = qs.answer !== null && 
    (typeof qs.answer === 'string' ? qs.answer.trim() !== '' : qs.answer.length > 0);
  
  if (qs.markedForReview && hasAnswer) return 'answered_marked';
  if (qs.markedForReview) return 'marked';
  if (hasAnswer) return 'answered';
  if (qs.visited) return 'not_answered';
  return 'not_visited';
}

export const useExamStore = create<ExamStore>((set, get) => ({
  attempt: null,
  pack: null,
  isLoading: false,

  startExam: (pack, existingAttempt) => {
    if (existingAttempt) {
      set({ pack, attempt: existingAttempt });
      return;
    }
    const attemptId = crypto.randomUUID();
    const questions = initQuestionStates(pack);
    const attempt: AttemptState = {
      attemptId,
      gaId: pack.id,
      startedAt: new Date().toISOString(),
      lastSavedAt: new Date().toISOString(),
      durationSeconds: pack.durationMinutes * 60,
      elapsedSeconds: 0,
      submitted: false,
      currentQuestion: 0,
      questions,
    };
    // Mark first question as visited
    const firstId = pack.questions[0]?.id;
    if (firstId) {
      attempt.questions[firstId] = { ...attempt.questions[firstId], visited: true, paletteState: 'not_answered' };
    }
    set({ pack, attempt });
    saveAttempt(attempt);
  },

  setAnswer: (questionId, answer) => {
    set(state => {
      if (!state.attempt) return state;
      const qs = state.attempt.questions[questionId];
      if (!qs) return state;
      const updated: QuestionState = { ...qs, answer, visited: true };
      updated.paletteState = computePaletteState(updated);
      const newAttempt: AttemptState = {
        ...state.attempt,
        questions: { ...state.attempt.questions, [questionId]: updated },
        lastSavedAt: new Date().toISOString(),
      };
      saveAttempt(newAttempt);
      return { attempt: newAttempt };
    });
  },

  clearAnswer: (questionId) => {
    set(state => {
      if (!state.attempt) return state;
      const qs = state.attempt.questions[questionId];
      if (!qs) return state;
      const updated: QuestionState = { ...qs, answer: null };
      updated.paletteState = computePaletteState(updated);
      const newAttempt: AttemptState = {
        ...state.attempt,
        questions: { ...state.attempt.questions, [questionId]: updated },
        lastSavedAt: new Date().toISOString(),
      };
      saveAttempt(newAttempt);
      return { attempt: newAttempt };
    });
  },

  toggleMarkForReview: (questionId) => {
    set(state => {
      if (!state.attempt) return state;
      const qs = state.attempt.questions[questionId];
      if (!qs) return state;
      const updated: QuestionState = { ...qs, markedForReview: !qs.markedForReview, visited: true };
      updated.paletteState = computePaletteState(updated);
      const newAttempt: AttemptState = {
        ...state.attempt,
        questions: { ...state.attempt.questions, [questionId]: updated },
        lastSavedAt: new Date().toISOString(),
      };
      saveAttempt(newAttempt);
      return { attempt: newAttempt };
    });
  },

  navigateTo: (index) => {
    set(state => {
      if (!state.attempt || !state.pack) return state;
      const qId = state.pack.questions[index]?.id;
      if (!qId) return state;
      const qs = state.attempt.questions[qId];
      const wasNotVisited = !qs.visited;
      const updated = wasNotVisited
        ? { ...qs, visited: true, paletteState: computePaletteState({ ...qs, visited: true }) as QuestionState['paletteState'] }
        : qs;
      const newAttempt: AttemptState = {
        ...state.attempt,
        currentQuestion: index,
        questions: wasNotVisited
          ? { ...state.attempt.questions, [qId]: updated }
          : state.attempt.questions,
      };
      if (wasNotVisited) saveAttempt(newAttempt);
      return { attempt: newAttempt };
    });
  },

  tickTimer: () => {
    set(state => {
      if (!state.attempt || state.attempt.submitted) return state;
      const newElapsed = state.attempt.elapsedSeconds + 1;
      const timeUp = newElapsed >= state.attempt.durationSeconds;
      const newAttempt = { ...state.attempt, elapsedSeconds: newElapsed };
      if (timeUp && !newAttempt.submitted) {
        // auto-save but don't submit here — let component handle
      }
      return { attempt: newAttempt };
    });
  },

  submitExam: () => {
    const { attempt, pack } = get();
    if (!attempt || !pack) return null;

    const submittedAttempt: AttemptState = { ...attempt, submitted: true, lastSavedAt: new Date().toISOString() };
    const result = scoreAttempt(submittedAttempt, pack);

    saveAttempt(submittedAttempt);
    saveResult(result);
    deleteAttempt(attempt.attemptId); // clean up active

    set({ attempt: submittedAttempt });
    return result;
  },

  reset: () => set({ attempt: null, pack: null }),
}));
