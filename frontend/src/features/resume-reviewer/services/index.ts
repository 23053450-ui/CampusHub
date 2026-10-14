import { mockResumeReviewerService } from "./mockService";
import { realResumeReviewerService } from "./realService";
import type { ResumeReviewerService } from "./types";

export * from "./types";

const isMock = import.meta.env.VITE_USE_MOCKS === "true";

export const resumeReviewerService: ResumeReviewerService = isMock
  ? mockResumeReviewerService
  : realResumeReviewerService;
