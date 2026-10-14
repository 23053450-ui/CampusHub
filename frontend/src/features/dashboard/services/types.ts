import type { UserProfile, Subject, Result } from "@/types";

export interface DashboardService {
  getProfile(): Promise<Result<UserProfile>>;
  getEnrolledSubjects(): Promise<Result<Subject[]>>;
  getAllSubjects(): Promise<Result<Subject[]>>;
  enrollSubject(subjectId: string): Promise<Result<void>>;
}
