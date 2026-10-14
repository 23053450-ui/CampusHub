import { mockDailyQuizService } from "./mockService";
import { realDailyQuizService } from "./realService";
import type { DailyQuizService } from "./types";

export * from "./types";

const isMock = import.meta.env.VITE_USE_MOCKS === "true";

export const dailyQuizService: DailyQuizService = isMock
  ? mockDailyQuizService
  : realDailyQuizService;
