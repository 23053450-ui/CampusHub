import { mockSubjectViewerService } from "./mockService";
import { realSubjectViewerService } from "./realService";
import type { SubjectViewerService } from "./types";

export * from "./types";

const isMock = import.meta.env.VITE_USE_MOCKS === "true";

export const subjectViewerService: SubjectViewerService = isMock
  ? mockSubjectViewerService
  : realSubjectViewerService;