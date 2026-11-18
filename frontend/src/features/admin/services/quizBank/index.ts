/**
 * @file index.ts
 * @description Service entry point with mock toggle for Quiz Bank feature.
 * @owner Platform Admin Team
 */

import { mockQuizBankService } from "./mockService";
import { realQuizBankService } from "./realService";
import type { QuizBankService } from "./types";

export const quizBankService: QuizBankService =
  import.meta.env.VITE_USE_MOCKS === "true"
    ? mockQuizBankService
    : realQuizBankService;

export * from "./types";
