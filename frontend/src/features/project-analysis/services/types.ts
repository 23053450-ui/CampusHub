import type { ProjectAnalysisResult, Result } from "@/types";

export interface ProjectAnalysisService {
  analyzeRepository(githubUrl: string): Promise<Result<ProjectAnalysisResult>>;
}
