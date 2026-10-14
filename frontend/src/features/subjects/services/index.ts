import { mockSubjectsService } from "./mockService";
import { realSubjectsService } from "./realService";
import type { SubjectsService } from "./types";

export * from "./types";

const isMock = import.meta.env.VITE_USE_MOCKS === "true";

export const subjectsService: SubjectsService = isMock
  ? mockSubjectsService
  : realSubjectsService;
