/**
 * @file types.ts
 * @description Types and service contracts for the Admin Quiz Bank feature.
 * @owner Platform Admin Team
 */

import type { Result } from "@/shared/result";

export interface SubjectNoteSummary {
  id: string;
  title: string;
  tag: string;
  storagePath?: string;
  createdAt: string;
}

export interface GeneratedQuizQuestion {
  tempId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
}

export interface ExistingQuizQuestion {
  id: string;
  subjectId: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty?: "easy" | "medium" | "hard" | string;
  topic?: string;
  source: string;
  status: string;
  createdAt?: string;
}

export interface GenerateQuizBankParams {
  subjectId: string;
  noteIds: string[];
  topic?: string;
  count: number;
  difficulty?: "easy" | "medium" | "hard";
}

export interface ApproveQuestionPayload {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  sourceSnippet?: string;
}

export interface QuizBankService {
  getSubjects(): Promise<Result<Array<{ id: string; name: string; code?: string }>>>;
  getApprovedNotes(subjectId: string): Promise<Result<SubjectNoteSummary[]>>;
  getExistingQuestions(subjectId: string): Promise<Result<ExistingQuizQuestion[]>>;
  generateQuestions(
    params: GenerateQuizBankParams,
  ): Promise<Result<{ title: string; questions: GeneratedQuizQuestion[] }>>;
  approveQuestions(
    subjectId: string,
    questions: ApproveQuestionPayload[],
  ): Promise<Result<{ inserted: number }>>;
  deleteQuestion(questionId: string): Promise<Result<void>>;
}
