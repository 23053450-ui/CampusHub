// =============================================================================
// CampusHub — Domain Types & Contracts
// =============================================================================

export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "RATE_LIMITED"
  | "NETWORK"
  | "INTERNAL";

export interface AppError {
  code: AppErrorCode;
  message: string;
  details?: unknown;
}

export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: AppError };

export type UserRole = "student" | "moderator" | "admin";

export interface UserProfile {
  id: string;
  handle: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  userCount: number;
  isEnrolled?: boolean;
}

export interface Post {
  id: string;
  subjectId: string;
  authorId: string;
  authorHandle: string;
  title: string;
  body: string;
  imageUrl: string | null;
  upvotes: number;
  downvotes: number;
  replyCount: number;
  createdAt: string;
  currentUserVote: 1 | -1 | null;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorHandle: string;
  body: string;
  createdAt: string;
}

export type NoteTag = "Lecture" | "PYQ" | "Summary" | "My Notes";

export interface Note {
  id: string;
  subjectId: string;
  userId: string;
  title: string;
  description: string | null;
  storagePath: string;
  tag: NoteTag;
  isShared: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface ResumeReviewResult {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestedKeywords: string[];
}

export interface ProjectAnalysisResult {
  repositoryName: string;
  techStack: string[];
  architectureSummary: string;
  strengths: string[];
  criticalIssues: string[];
  recommendations: string[];
}
