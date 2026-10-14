import type { ResumeReviewResult, Result } from "@/types";
import type { ResumeReviewerService } from "./types";

const mockResumeResult: ResumeReviewResult = {
  score: 82,
  summary:
    "Strong technical foundation with clear impact metrics in software engineering projects. Good progression from foundational coursework to full-stack application development.",
  strengths: [
    "Quantified achievements (e.g. 'reduced latency by 35% through Redis caching')",
    "Clean single-column layout adhering to standard ATS parsing parsers",
    "Prominent technical skills section categorizing languages, frameworks, and developer tools",
  ],
  improvements: [
    "Include more domain-specific keywords corresponding to the target role",
    "Clarify role and contributions in multi-member academic capstone projects",
    "Replace passive phrasing with active action verbs (e.g., 'Engineered', 'Orchestrated')",
  ],
  suggestedKeywords: [
    "Distributed Systems",
    "CI/CD Pipeline",
    "RESTful API Design",
    "PostgreSQL Optimization",
    "Unit Testing & TDD",
    "Docker Containerization",
  ],
};

export const mockResumeReviewerService: ResumeReviewerService = {
  async reviewResume(_file: File, _targetRole?: string): Promise<Result<ResumeReviewResult>> {
    // Simulate PDF parsing and AI scoring latency
    await new Promise((resolve) => setTimeout(resolve, 850));
    return { data: mockResumeResult, error: null };
  },
};
