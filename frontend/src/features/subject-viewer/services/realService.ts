import { supabase } from "@/lib/supabase";
import type { Result } from "@/shared/result";
import type { Subject } from "@/shared/user";
import type { SubjectNote, SubjectViewerService } from "./types";

export const realSubjectViewerService: SubjectViewerService = {
  async getSubject(subjectId: string): Promise<Result<Subject>> {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .single();

    if (error) {
      return {
        data: null,
        error: {
          code: "NOT_FOUND",
          message: error.message,
        },
      };
    }

    return {
      data: data as Subject,
      error: null,
    };
  },

  async getNotesTree(subjectId: string): Promise<Result<SubjectNote[]>> {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("subject_id", subjectId)
      .eq("is_approved", true);

    if (error) {
      return {
        data: null,
        error: {
          code: "INTERNAL",
          message: error.message,
        },
      };
    }

    return {
      data: (data ?? []) as unknown as SubjectNote[],
      error: null,
    };
  },

  async getNoteContent(storagePath: string): Promise<Result<Blob>> {
    const { data, error } = await supabase.storage
      .from("subject-notes")
      .download(storagePath);

    if (error) {
      return {
        data: null,
        error: {
          code: "INTERNAL",
          message: error.message,
        },
      };
    }

    return {
      data,
      error: null,
    };
  },
};