import { apiPostForm } from "@/lib/api-client";
import type { ResumeReviewResult, Result } from "@/types";
import type { ResumeReviewerService } from "./types";

export const realResumeReviewerService: ResumeReviewerService = {
  async reviewResume(file: File, targetRole?: string): Promise<Result<ResumeReviewResult>> {
    const formData = new FormData();
    formData.append("file", file);
    if (targetRole) {
      formData.append("target_role", targetRole);
    }

    return apiPostForm<ResumeReviewResult>("/api/v1/resume-reviewer/review", formData);
  },
};
