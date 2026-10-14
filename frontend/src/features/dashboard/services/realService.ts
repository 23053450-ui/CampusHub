import { supabase } from "@/lib/supabase";
import type { UserProfile, Subject, Result } from "@/types";
import type { DashboardService } from "./types";

export const realDashboardService: DashboardService = {
  async getProfile(): Promise<Result<UserProfile>> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          data: null,
          error: { code: "UNAUTHENTICATED", message: "User not authenticated" },
        };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error.message, details: error },
        };
      }

      const profile: UserProfile = {
        id: data.id,
        handle: data.handle,
        fullName: data.full_name,
        avatarUrl: data.avatar_url,
        role: data.role,
        createdAt: data.created_at,
      };

      return { data: profile, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: "NETWORK", message: err?.message || "Failed to fetch profile" },
      };
    }
  },

  async getEnrolledSubjects(): Promise<Result<Subject[]>> {
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

      // Query enrolled subjects via subject_enrollments join
      const { data, error } = await supabase
        .from("subject_enrollments")
        .select(`
          subject_id,
          subjects (
            id,
            name,
            code
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error.message, details: error },
        };
      }

      const subjects: Subject[] = (data || []).map((row: any) => ({
        id: row.subjects.id,
        name: row.subjects.name,
        code: row.subjects.code,
        userCount: 0,
        isEnrolled: true,
      }));

      return { data: subjects, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: "NETWORK", message: err?.message || "Failed to fetch enrolled subjects" },
      };
    }
  },

  async getAllSubjects(): Promise<Result<Subject[]>> {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, code");

      if (error) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error.message, details: error },
        };
      }

      const subjects: Subject[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        userCount: 0,
      }));

      return { data: subjects, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: "NETWORK", message: err?.message || "Failed to fetch subjects" },
      };
    }
  },

  async enrollSubject(subjectId: string): Promise<Result<void>> {
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

      const { error } = await supabase.from("subject_enrollments").insert({
        user_id: user.id,
        subject_id: subjectId,
      });

      if (error) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error.message, details: error },
        };
      }

      return { data: undefined, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: "NETWORK", message: err?.message || "Failed to enroll in subject" },
      };
    }
  },
};
