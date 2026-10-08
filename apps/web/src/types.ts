export interface User {
  id: string;
  email: string;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export interface Question {
  id: string;
  topicId: string;
  prompt: string;
  options: { id: string; text: string }[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface McqSubmitResult {
  activityId: string;
  isCorrect: boolean;
  correctOptionId: string;
  explanation: string | null;
}

export interface ActivityHistoryItem {
  id: string;
  type: string;
  topicName: string;
  topicSlug: string;
  createdAt: string;
  isCorrect: boolean | null;
  timeTakenMs: number | null;
  questionPrompt: string | null;
}

export interface DashboardSummary {
  readiness: { score: number; subjectsCovered: number };
  weakTopics: { topicId: string; name: string; slug: string; masteryScore: number }[];
  balance: { topicId: string; name: string; slug: string; activityCount: number; percentage: number }[];
  heatmap: { date: string; count: number }[];
}

export interface SqlExercise {
  id: string;
  topicId: string;
  prompt: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface SqlSubmitResult {
  activityId: string;
  isCorrect: boolean;
  executionError: string | null;
  rowCount: number;
}

export interface DsaProblem {
  id: string;
  topicId: string;
  prompt: string;
  functionName: string;
  starterCode: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface DsaTestResult {
  passed: boolean;
  error?: string;
}

export interface DsaSubmitResult {
  activityId: string;
  isCorrect: boolean;
  testsPassed: number;
  testsTotal: number;
  results: DsaTestResult[];
}

export interface ExplainResult {
  explanation: string;
}

export interface Recommendation {
  topicId: string;
  topicName: string;
  topicSlug: string;
  reason: string;
  score: number;
}