import { supabase } from "@/lib/supabase";
import { apiPost } from "@/lib/api-client";
import type { Subject, Note, Flashcard, QuizQuestion, Result } from "@/types";
import type { SubjectsService } from "./types";

export const realSubjectsService: SubjectsService = {
  async getSubject(subjectId: string): Promise<Result<Subject>> {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, code")
        .eq("id", subjectId)
        .single();

      if (error) {
        return { data: null, error: { code: "NOT_FOUND", message: error.message, details: error } };
      }

      return {
        data: {
          id: data.id,
          name: data.name,
          code: data.code,
          userCount: 0,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: { code: "NETWORK", message: err?.message || "Failed to fetch subject" } };
    }
  },

  async getSubjectNotes(subjectId: string): Promise<Result<Note[]>> {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("subject_id", subjectId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) {
        return { data: null, error: { code: "INTERNAL", message: error.message, details: error } };
      }

      const notes: Note[] = (data || []).map((n: any) => ({
        id: n.id,
        subjectId: n.subject_id,
        userId: n.user_id,
        title: n.title,
        description: n.description,
        storagePath: n.storage_path,
        tag: n.tag,
        isShared: n.is_shared,
        isApproved: n.is_approved,
        createdAt: n.created_at,
      }));

      return { data: notes, error: null };
    } catch (err: any) {
      return { data: null, error: { code: "NETWORK", message: err?.message || "Failed to fetch subject notes" } };
    }
  },

  async chatWithDocument(noteId: string, message: string, contextText: string): Promise<Result<{ reply: string }>> {
    return apiPost<{ reply: string }>("/api/v1/subjects-ai/chat", {
      note_id: noteId,
      message,
      context: contextText,
    });
  },

  async generateFlashcards(noteId: string, contextText: string): Promise<Result<Flashcard[]>> {
    return apiPost<Flashcard[]>("/api/v1/subjects-ai/flashcards", {
      note_id: noteId,
      context: contextText,
    });
  },

  async generateQuiz(noteId: string, contextText: string): Promise<Result<QuizQuestion[]>> {
    return apiPost<QuizQuestion[]>("/api/v1/subjects-ai/quiz", {
      note_id: noteId,
      context: contextText,
    });
  },
};
