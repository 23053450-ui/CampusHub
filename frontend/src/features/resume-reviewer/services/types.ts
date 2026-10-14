import type { ResumeReviewResult, Result } from "@/types";

export interface ResumeReviewerService {
  reviewResume(file: File, targetRole?: string): Promise<Result<ResumeReviewResult>>;
}
