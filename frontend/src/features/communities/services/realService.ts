/**
 * @file realService.ts
 * @description Direct Supabase client implementation of CommunitiesService.
 * @owner Communities Team
 */

import { supabase } from "@/lib/supabase";
import type { Result } from "@/shared/result";
import type {
  CommunitiesService,
  SubjectForum,
  Post,
  Comment,
  ResourceNote,
  ResourceType,
} from "./types";

export const realCommunitiesService: CommunitiesService = {
  async getSubjectForums(): Promise<Result<SubjectForum[]>> {
    try {
      const { data: subjects, error } = await supabase
        .from("subjects")
        .select("id, name, code, created_at")
        .order("name", { ascending: true });

      if (error) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error.message },
        };
      }

      const forums: SubjectForum[] = (subjects || []).map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        memberCount: 1200, // Estimated aggregate member count
        isPinned: false,
      }));

      return { data: forums, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message },
      };
    }
  },

  async getPosts(subjectId: string, sort: "new" | "top" | "hot" = "new"): Promise<Result<Post[]>> {
    try {
      let query = supabase
        .from("posts")
        .select("*, profiles!posts_author_id_fkey(handle, avatar_url)")
        .eq("subject_id", subjectId);

      if (sort === "top") {
        query = query.order("upvotes", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error.message },
        };
      }

      const user = (await supabase.auth.getUser()).data.user;

      let userVotes: Record<string, 1 | -1> = {};
      if (user && data && data.length > 0) {
        const postIds = data.map((p) => p.id);
        const { data: votes } = await supabase
          .from("post_votes")
          .select("post_id, vote")
          .eq("user_id", user.id)
          .in("post_id", postIds);

        if (votes) {
          votes.forEach((v) => {
            userVotes[v.post_id] = v.vote as 1 | -1;
          });
        }
      }

      const posts: Post[] = (data || []).map((row: any) => ({
        id: row.id,
        subjectId: row.subject_id,
        authorId: row.author_id,
        authorHandle: row.profiles?.handle || "Anonymous",
        authorAvatarUrl: row.profiles?.avatar_url || null,
        title: row.title,
        body: row.body,
        imageUrl: row.image_url,
        upvotes: row.upvotes ?? 0,
        downvotes: row.downvotes ?? 0,
        replyCount: row.reply_count ?? 0,
        createdAt: row.created_at,
        currentUserVote: userVotes[row.id] ?? null,
      }));

      return { data: posts, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message },
      };
    }
  },

  async createPost(data): Promise<Result<Post>> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        return {
          data: null,
          error: { code: "UNAUTHENTICATED", message: "User is not authenticated" },
        };
      }

      const { data: inserted, error } = await supabase
        .from("posts")
        .insert({
          subject_id: data.subjectId,
          author_id: user.id,
          title: data.title,
          body: data.body,
          image_url: data.imageUrl || null,
        })
        .select("*, profiles!posts_author_id_fkey(handle, avatar_url)")
        .single();

      if (error) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error.message },
        };
      }

      const post: Post = {
        id: inserted.id,
        subjectId: inserted.subject_id,
        authorId: inserted.author_id,
        authorHandle: inserted.profiles?.handle || "Anonymous",
        authorAvatarUrl: inserted.profiles?.avatar_url || null,
        title: inserted.title,
        body: inserted.body,
        imageUrl: inserted.image_url,
        upvotes: 0,
        downvotes: 0,
        replyCount: 0,
        createdAt: inserted.created_at,
        currentUserVote: null,
      };

      return { data: post, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message },
      };
    }
  },

  async votePost(postId: string, voteValue: 1 | -1 | null): Promise<Result<{ upvotes: number; downvotes: number; currentUserVote: 1 | -1 | null }>> {
    try {
      const { error } = await supabase.rpc("vote_post", {
        p_post_id: postId,
        p_vote_value: voteValue,
      });

      if (error) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error.message },
        };
      }

      // Fetch refreshed post vote counters
      const { data: postData } = await supabase
        .from("posts")
        .select("upvotes, downvotes")
        .eq("id", postId)
        .single();

      return {
        data: {
          upvotes: postData?.upvotes ?? 0,
          downvotes: postData?.downvotes ?? 0,
          currentUserVote: voteValue,
        },
        error: null,
      };
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message },
      };
    }
  },

  async getComments(postId: string): Promise<Result<Comment[]>> {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles!comments_author_id_fkey(handle, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error.message },
        };
      }

      const comments: Comment[] = (data || []).map((row: any) => ({
        id: row.id,
        postId: row.post_id,
        authorId: row.author_id,
        authorHandle: row.profiles?.handle || "Anonymous",
        authorAvatarUrl: row.profiles?.avatar_url || null,
        body: row.body,
        createdAt: row.created_at,
      }));

      return { data: comments, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message },
      };
    }
  },

  async createComment(postId: string, body: string): Promise<Result<Comment>> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        return {
          data: null,
          error: { code: "UNAUTHENTICATED", message: "User is not authenticated" },
        };
      }

      const { data: inserted, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          author_id: user.id,
          body,
        })
        .select("*, profiles!comments_author_id_fkey(handle, avatar_url)")
        .single();

      if (error) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error.message },
        };
      }

      const comment: Comment = {
        id: inserted.id,
        postId: inserted.post_id,
        authorId: inserted.author_id,
        authorHandle: inserted.profiles?.handle || "Anonymous",
        authorAvatarUrl: inserted.profiles?.avatar_url || null,
        body: inserted.body,
        createdAt: inserted.created_at,
      };

      return { data: comment, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message },
      };
    }
  },

  async getResources(subjectId: string, type: ResourceType): Promise<Result<ResourceNote[]>> {
    try {
      const tagFilter = type === "PYQ" ? "PYQ" : "Lecture";
      let query = supabase
        .from("notes")
        .select("*, profiles!notes_user_id_fkey(handle)")
        .eq("subject_id", subjectId);

      if (type === "PYQ") {
        query = query.eq("tag", "PYQ");
      } else {
        query = query.neq("tag", "PYQ");
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error.message },
        };
      }

      const notes: ResourceNote[] = (data || []).map((row: any) => ({
        id: row.id,
        subjectId: row.subject_id,
        title: row.title,
        type: row.tag === "PYQ" ? "PYQ" : "Note",
        category: (row.description && ["Day wise", "Unit wise", "Other"].includes(row.description))
          ? (row.description as any)
          : "Other",
        uploaderHandle: row.profiles?.handle || "Anonymous",
        pageCount: 15,
        storagePath: row.storage_path,
        createdAt: row.created_at,
      }));

      return { data: notes, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message },
      };
    }
  },

  async uploadResource(data): Promise<Result<ResourceNote>> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        return {
          data: null,
          error: { code: "UNAUTHENTICATED", message: "User is not authenticated" },
        };
      }

      let storagePath = `resources/${data.subjectId}/${Date.now()}_${data.title}`;
      if (data.file) {
        const { error: uploadError } = await supabase.storage
          .from("subject-notes")
          .upload(`${user.id}/${data.file.name}`, data.file);
        if (uploadError) {
          return {
            data: null,
            error: { code: "INTERNAL", message: uploadError.message },
          };
        }
        storagePath = `${user.id}/${data.file.name}`;
      }

      const { data: inserted, error } = await supabase
        .from("notes")
        .insert({
          subject_id: data.subjectId,
          user_id: user.id,
          title: data.title,
          description: data.category || "Other",
          storage_path: storagePath,
          tag: data.type === "PYQ" ? "PYQ" : "Lecture",
          is_shared: true,
          is_approved: false,
        })
        .select("*, profiles!notes_user_id_fkey(handle)")
        .single();

      if (error) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error.message },
        };
      }

      const note: ResourceNote = {
        id: inserted.id,
        subjectId: inserted.subject_id,
        title: inserted.title,
        type: inserted.tag === "PYQ" ? "PYQ" : "Note",
        category: data.category || "Other",
        uploaderHandle: inserted.profiles?.handle || "Anonymous",
        pageCount: data.pageCount || 10,
        storagePath: inserted.storage_path,
        createdAt: inserted.created_at,
      };

      return { data: note, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message },
      };
    }
  },
};
