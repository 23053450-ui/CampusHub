import type { ProjectAnalysisResult, Result } from "@/types";
import type { ProjectAnalysisService } from "./types";

const mockAnalysisResult: ProjectAnalysisResult = {
  repositoryName: "campus-hub-platform",
  techStack: ["React 19", "TypeScript", "FastAPI", "Python 3.11", "PostgreSQL", "Supabase", "Tailwind CSS"],
  architectureSummary:
    "Modular monolithic frontend coupled with a stateless microservice architecture for AI reasoning and Supabase BaaS for relational persistence and storage.",
  strengths: [
    "Strict 1:1 feature folder ownership eliminating team merge conflicts",
    "Clean typed Result<T> monad error handling across all API boundaries",
    "Separation of concerns between stateful database ops and stateless AI processing",
  ],
  criticalIssues: [
    "Rate limiting middleware should be enforced on public analysis endpoints to prevent quota exhaustion",
    "Max file upload limit (5MB) needs client-side validation before dispatching multipart payload",
  ],
  recommendations: [
    "Introduce response caching for frequently audited public repositories",
    "Add Docker Compose configuration for quick local full-stack startup",
    "Implement automated integration smoke tests for AI evaluation pipelines",
  ],
};

export const mockProjectAnalysisService: ProjectAnalysisService = {
  async analyzeRepository(_githubUrl: string): Promise<Result<ProjectAnalysisResult>> {
    // Simulate AI audit processing latency
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { data: mockAnalysisResult, error: null };
  },
};
