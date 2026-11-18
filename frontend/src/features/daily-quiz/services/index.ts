/**
 * @file index.ts
 * @description Selects the appropriate Daily Quiz service.
 * @owner Daily Quiz Team
 */

import type { DailyQuizService } from "./types";
import { realDailyQuizService } from "./realService";

export const dailyQuizService: DailyQuizService = realDailyQuizService;

export * from "./types";
