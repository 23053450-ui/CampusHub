import { apiGet, apiPost } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import type { Result } from "@/types";
import type {
  DailyQuizService,
  TodayQuizResponse,
  QuizSubmissionResult,
  UserStreak,
} from "./types";

export const realDailyQuizService: DailyQuizService = {
  async getTodayQuiz(): Promise<Result<TodayQuizResponse>> {
    return apiGet<TodayQuizResponse>("/api/v1/daily-quiz/today");
  },

  async submitQuiz(answers: Record<string, number>): Promise<Result<QuizSubmissionResult>> {
    return apiPost<QuizSubmissionResult>("/api/v1/daily-quiz/submit", { answers });
  },

  async getUserStreak(): Promise<Result<UserStreak>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          data: null,
          error: { code: "UNAUTHENTICATED", message: "User not authenticated" },
        };
      }

      const { data, error } = await supabase
        .from("user_streaks")
        .select("current_streak, best_streak, last_completed_date")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        return { data: null, error: { code: "INTERNAL", message: error.message, details: error } };
      }

      return {
        data: {
          currentStreak: data?.current_streak || 0,
          bestStreak: data?.best_streak || 0,
          lastCompletedDate: data?.last_completed_date || null,
        },
        error: null,
      };
    } catch (err: any) {
      return {
        data: null,
        error: { code: "NETWORK", message: err?.message || "Failed to fetch streak" },
      };
    }
  },
};
