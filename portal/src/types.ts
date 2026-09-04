// Core domain types for the LLM Exam Portal

export type QuestionType = 'single_choice' | 'multiple_select' | 'numeric' | 'text';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionAnswer {
  type: 'option' | 'numeric' | 'boolean' | 'text';
  value: string | string[];
}

export interface Question {
  id: string;
  num: string;
  title: string;
  type: QuestionType;
  context: string | null;
  questionText: string;
  bodyMd: string;
  options: QuestionOption[];
  answer: QuestionAnswer | null;
  solutionMd: string;
  marks: { correct: number; incorrect: number; unanswered: number };
}

export interface GACatalogItem {
  id: string;
  week: number;
  title: string;
  category?: 'GA' | 'PYQ' | 'LEARNING';
  label?: string;
  topics: string[];
  score: number | null;
  maxScore: number | null;
  submittedDate: string | null;
  questionCount: number;
  durationMinutes: number;
}

export interface GAPack extends GACatalogItem {
  questions: Question[];
}

// Exam state types
export type PaletteState = 
  | 'not_visited'    // grey
  | 'not_answered'   // red
  | 'answered'       // green
  | 'marked'         // purple
  | 'answered_marked'; // purple-green

export interface QuestionState {
  paletteState: PaletteState;
  answer: string | string[] | null;  // selected option IDs or numeric string
  markedForReview: boolean;
  visited: boolean;
  timeSpentSeconds: number;
}

export interface AttemptState {
  attemptId: string;
  gaId: string;
  startedAt: string;  // ISO
  lastSavedAt: string;
  durationSeconds: number;
  elapsedSeconds: number;
  submitted: boolean;
  currentQuestion: number;
  questions: Record<string, QuestionState>;  // keyed by question.id
}

export interface AttemptResult {
  attemptId: string;
  gaId: string;
  completedAt: string;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  totalMarks: number;
  maxMarks: number;
  accuracyPercent: number;
  perQuestion: PerQuestionResult[];
}

export interface PerQuestionResult {
  questionId: string;
  num: string;
  type: QuestionType;
  submittedAnswer: string | string[] | null;
  correctAnswer: QuestionAnswer | null;
  isCorrect: boolean;
  marksAwarded: number;
  maxMarks: number;
}
