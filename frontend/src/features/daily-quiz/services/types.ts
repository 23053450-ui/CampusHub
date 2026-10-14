import type { QuizQuestion, Result } from "@/types";

export interface TodayQuizResponse {
  date: string;
  questions: QuizQuestion[];
}

export interface QuizSubmissionResult {
  score: number;
  total: number;
  streakCount: number;
}

export interface UserStreak {
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
}

export interface DailyQuizService {
  getTodayQuiz(): Promise<Result<TodayQuizResponse>>;
  submitQuiz(answers: Record<string, number>): Promise<Result<QuizSubmissionResult>>;
  getUserStreak(): Promise<Result<UserStreak>>;
}
