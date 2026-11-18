/**
 * @file realService.ts
 * @description Production implementation of the Quiz Bank Service using Supabase and FastAPI backend.
 * @owner Platform Admin Team
 */

import { supabase } from "@/lib/supabase";
import { BACKEND_URL } from "@/lib/api-client";
import type { Result } from "@/shared/result";
import type {
  ApproveQuestionPayload,
  ExistingQuizQuestion,
  GenerateQuizBankParams,
  GeneratedQuizQuestion,
  QuizBankService,
  SubjectNoteSummary,
} from "./types";

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    return data.session.access_token;
  }
  if (import.meta.env.DEV) {
    return "mock-dev";
  }
  throw new Error("Your session has expired. Please log in again.");
}

export const realQuizBankService: QuizBankService = {
  async getSubjects() {
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name, code")
      .order("id");

    if (error) {
      return {
        data: null,
        error: {
          code: "INTERNAL",
          message: error.message,
          details: error,
        },
      };
    }

    return {
      data: (data || []).map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code ?? undefined,
      })),
      error: null,
    };
  },

  async getApprovedNotes(subjectId: string): Promise<Result<SubjectNoteSummary[]>> {
    const { data, error } = await supabase
      .from("notes")
      .select("id, title, tag, storage_path, created_at")
      .eq("subject_id", subjectId)
      .eq("status", "approved")
      .eq("is_shared", true)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        data: null,
        error: {
          code: "INTERNAL",
          message: error.message,
          details: error,
        },
      };
    }

    return {
      data: (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        tag: row.tag,
        storagePath: row.storage_path,
        createdAt: row.created_at,
      })),
      error: null,
    };
  },

  async getExistingQuestions(subjectId: string): Promise<Result<ExistingQuizQuestion[]>> {
    const { data, error } = await supabase
      .from("daily_quiz_questions")
      .select(
        "id, subject_id, question, options, correct_answer_index, explanation, difficulty, topic, source, status, created_at",
      )
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        data: null,
        error: {
          code: "INTERNAL",
          message: error.message,
          details: error,
        },
      };
    }

    return {
      data: (data || []).map((row) => ({
        id: row.id,
        subjectId: row.subject_id,
        question: row.question,
        options: Array.isArray(row.options) ? row.options : [],
        correctAnswerIndex: row.correct_answer_index,
        explanation: row.explanation,
        difficulty: row.difficulty,
        topic: row.topic,
        source: row.source,
        status: row.status,
        createdAt: row.created_at,
      })),
      error: null,
    };
  },

  async generateQuestions(
    params: GenerateQuizBankParams,
  ): Promise<Result<{ title: string; questions: GeneratedQuizQuestion[] }>> {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${BACKEND_URL}/api/v1/subjects-ai/quiz-bank/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject_id: params.subjectId,
            note_ids: params.noteIds,
            topic: params.topic || null,
            count: params.count,
            difficulty: params.difficulty || null,
          }),
        },
      );

      if (!response.ok) {
        let errMessage = `Generation failed (${response.status})`;
        try {
          const body = await response.json();
          if (body?.detail) {
            errMessage = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
          }
        } catch {
          // ignore
        }
        return {
          data: null,
          error: { code: "INTERNAL", message: errMessage },
        };
      }

      const result = await response.json();
      const mappedQuestions: GeneratedQuizQuestion[] = (result.questions || []).map(
        (q: any, idx: number) => ({
          tempId: `gen-${Date.now()}-${idx}`,
          question: q.question,
          options: q.options,
          correctIndex: q.correct_index,
          explanation: q.explanation,
          difficulty: q.difficulty || "medium",
          topic: q.topic || "Fundamentals",
        }),
      );

      return {
        data: {
          title: result.title || `${params.subjectId.toUpperCase()} Quiz Bank`,
          questions: mappedQuestions,
        },
        error: null,
      };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "INTERNAL",
          message: err?.message || "Failed to generate questions with AI.",
        },
      };
    }
  },

  async approveQuestions(
    subjectId: string,
    questions: ApproveQuestionPayload[],
  ): Promise<Result<{ inserted: number }>> {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${BACKEND_URL}/api/v1/subjects-ai/quiz-bank/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject_id: subjectId,
            questions: questions.map((q) => ({
              question: q.question,
              options: q.options,
              correct_index: q.correctIndex,
              explanation: q.explanation,
              difficulty: q.difficulty,
              topic: q.topic,
              source_snippet: q.sourceSnippet,
            })),
          }),
        },
      );

      if (!response.ok) {
        let errMessage = `Approval failed (${response.status})`;
        try {
          const body = await response.json();
          if (body?.detail) {
            errMessage = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
          }
        } catch {
          // ignore
        }
        return {
          data: null,
          error: { code: "INTERNAL", message: errMessage },
        };
      }

      const result = await response.json();
      return {
        data: { inserted: result.inserted ?? questions.length },
        error: null,
      };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "INTERNAL",
          message: err?.message || "Failed to approve and insert quiz questions.",
        },
      };
    }
  },

  async deleteQuestion(questionId: string): Promise<Result<void>> {
    const { error } = await supabase
      .from("daily_quiz_questions")
      .delete()
      .eq("id", questionId);

    if (error) {
      return {
        data: null,
        error: {
          code: "INTERNAL",
          message: error.message,
          details: error,
        },
      };
    }

    return { data: undefined, error: null };
  },
};
