/**
 * @file realService.ts
 * @description Direct Supabase client implementation of DashboardService.
 * @owner Dashboard Team
 */

import { supabase } from "@/lib/supabase";
import type { Result } from "@/shared/result";
import type { Subject } from "@/shared/user";
import type { Post } from "@/shared/communities";
import type { DashboardService } from "./types";

export const realDashboardService: DashboardService = {
  async getEnrolledSubjects(): Promise<Result<Subject[]>> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from("user_subjects")
        .select("subject_id, subjects(id, name, code)")
        .eq("user_id", user.id);

      if (error) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error.message },
        };
      }

      if (!data || data.length === 0) {
        return { data: [], error: null };
      }

      const enrolled: Subject[] = data
        .map((row: any) => row.subjects)
        .filter(Boolean)
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          code: s.code,
        }));

      return { data: enrolled, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message },
      };
    }
  },

  async enrollSubjects(subjectIds: string[]): Promise<Result<Subject[]>> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        return {
          data: null,
          error: { code: "UNAUTHENTICATED", message: "User not authenticated" },
        };
      }

      // 1. Fetch current enrollments
      const { data: currentRows, error: fetchErr } = await supabase
        .from("user_subjects")
        .select("subject_id")
        .eq("user_id", user.id);

      if (fetchErr) {
        return {
          data: null,
          error: { code: "INTERNAL", message: fetchErr.message },
        };
      }

      const currentIds = new Set((currentRows || []).map((r: any) => r.subject_id));
      const targetIds = new Set(subjectIds);

      const toAdd = subjectIds.filter((id) => !currentIds.has(id));
      const toRemove = Array.from(currentIds).filter((id) => !targetIds.has(id));

      // 2. Remove unselected subjects (Safely leaves public.notes and files completely untouched)
      if (toRemove.length > 0) {
        const { error: deleteErr } = await supabase
          .from("user_subjects")
          .delete()
          .eq("user_id", user.id)
          .in("subject_id", toRemove);

        if (deleteErr) {
          return {
            data: null,
            error: { code: "INTERNAL", message: deleteErr.message },
          };
        }
      }

      // 3. Add newly selected subjects
      if (toAdd.length > 0) {
        const rowsToInsert = toAdd.map((id) => ({
          user_id: user.id,
          subject_id: id,
        }));
        const { error: insertErr } = await supabase
          .from("user_subjects")
          .insert(rowsToInsert);

        if (insertErr) {
          return {
            data: null,
            error: { code: "INTERNAL", message: insertErr.message },
          };
        }
      }

      return realDashboardService.getEnrolledSubjects();
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message },
      };
    }
  },

  async getAllSubjects(): Promise<Result<Subject[]>> {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, code")
        .order("name", { ascending: true });

      if (error) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error.message },
        };
      }

      const subjects: Subject[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        code: row.code,
      }));

      return { data: subjects, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message },
      };
    }
  },

  async getHotDiscussions(limit = 5): Promise<Result<Post[]>> {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles!posts_author_id_fkey(handle, full_name, avatar_url)")
        .order("hot_score", { ascending: false })
        .limit(limit);

      if (error) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error.message },
        };
      }

      const posts: Post[] = (data || []).map((row: any) => ({
        id: row.id,
        subjectId: row.subject_id,
        authorId: row.author_id,
        authorName: row.profiles?.full_name || "Student",
        authorHandle: row.profiles?.handle || "Anonymous",
        authorAvatarUrl: row.profiles?.avatar_url || null,
        title: row.title,
        body: row.body || "",
        images: row.images || [],
        imageUrl: row.images?.[0] || null,
        upvotes: row.upvotes ?? 0,
        downvotes: row.downvotes ?? 0,
        replyCount: row.reply_count ?? 0,
        hotScore: row.hot_score,
        createdAt: row.created_at,
      }));

      return { data: posts, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message },
      };
    }
  },
};
