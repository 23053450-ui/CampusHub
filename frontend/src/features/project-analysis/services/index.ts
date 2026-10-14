import { mockProjectAnalysisService } from "./mockService";
import { realProjectAnalysisService } from "./realService";
import type { ProjectAnalysisService } from "./types";

export * from "./types";

const isMock = import.meta.env.VITE_USE_MOCKS === "true";

export const projectAnalysisService: ProjectAnalysisService = isMock
  ? mockProjectAnalysisService
  : realProjectAnalysisService;
