import { apiPost } from "@/lib/api-client";
import type { ProjectAnalysisResult, Result } from "@/types";
import type { ProjectAnalysisService } from "./types";

export const realProjectAnalysisService: ProjectAnalysisService = {
  async analyzeRepository(githubUrl: string): Promise<Result<ProjectAnalysisResult>> {
    return apiPost<ProjectAnalysisResult>("/api/v1/project-analysis/analyze", {
      github_url: githubUrl,
    });
  },
};
