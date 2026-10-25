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
        images: row.images || (row.image_url ? [row.image_url] : []),
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

  async getPost(postId: string): Promise<Result<Post>> {
    try {
      const { data: row, error } = await supabase
        .from("posts")
        .select("*, profiles!posts_author_id_fkey(handle, avatar_url)")
        .eq("id", postId)
        .single();

      if (error || !row) {
        return {
          data: null,
          error: { code: "NOT_FOUND", message: error?.message || "Post not found" },
        };
      }

      const user = (await supabase.auth.getUser()).data.user;
      let currentUserVote: 1 | -1 | null = null;
      if (user) {
        const { data: voteData } = await supabase
          .from("post_votes")
          .select("vote")
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (voteData) {
          currentUserVote = voteData.vote as 1 | -1;
        }
      }

      const post: Post = {
        id: row.id,
        subjectId: row.subject_id,
        authorId: row.author_id,
        authorHandle: row.profiles?.handle || "Anonymous",
        authorAvatarUrl: row.profiles?.avatar_url || null,
        title: row.title,
        body: row.body || "",
        imageUrl: row.image_url || null,
        images: row.images || (row.image_url ? [row.image_url] : []),
        upvotes: row.upvotes ?? 0,
        downvotes: row.downvotes ?? 0,
        replyCount: row.reply_count ?? 0,
        createdAt: row.created_at,
        currentUserVote,
      };

      return { data: post, error: null };
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

      const trimmedTitle = (data.title || "").trim();
      if (!trimmedTitle) {
        return {
          data: null,
          error: { code: "VALIDATION", message: "Post title is required." },
        };
      }
      if (trimmedTitle.length > 300) {
        return {
          data: null,
          error: { code: "VALIDATION", message: "Post title cannot exceed 300 characters." },
        };
      }

      if (data.body && data.body.length > 2000) {
        return {
          data: null,
          error: { code: "VALIDATION", message: "Post body cannot exceed 2000 characters." },
        };
      }

      const images = data.images && data.images.length > 0
        ? data.images
        : data.imageUrl
        ? [data.imageUrl]
        : [];

      if (images.length > 5) {
        return {
          data: null,
          error: { code: "VALIDATION", message: "Maximum of 5 images allowed per post." },
        };
      }

      const { data: inserted, error } = await supabase
        .from("posts")
        .insert({
          subject_id: data.subjectId,
          author_id: user.id,
          title: trimmedTitle,
          body: data.body ? data.body.trim() : "",
          image_url: images[0] || null,
          images: images,
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
        images: images,
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
        parentId: row.parent_id || null,
        depth: row.depth ?? 0,
        authorId: row.author_id,
        authorHandle: row.profiles?.handle || "Anonymous",
        authorAvatarUrl: row.profiles?.avatar_url || null,
        body: row.body,
        images: row.image_urls || [],
        upvotes: row.upvotes ?? 0,
        downvotes: row.downvotes ?? 0,
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

  async createComment(
    postId: string,
    body: string,
    parentId?: string | null,
    images?: string[]
  ): Promise<Result<Comment>> {
    try {
      const trimmedBody = (body || "").trim();
      if (!trimmedBody || trimmedBody.length > 2000) {
        return {
          data: null,
          error: {
            code: "VALIDATION",
            message: "Comment body must be between 1 and 2,000 characters.",
          },
        };
      }

      if (images && images.length > 2) {
        return {
          data: null,
          error: {
            code: "VALIDATION",
            message: "A comment reply can attach at most 2 images.",
          },
        };
      }

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        return {
          data: null,
          error: { code: "UNAUTHENTICATED", message: "User is not authenticated" },
        };
      }

      // If parent is given, verify depth < 11
      if (parentId) {
        const { data: parentComment, error: parentError } = await supabase
          .from("comments")
          .select("id, post_id, depth")
          .eq("id", parentId)
          .single();

        if (parentError || !parentComment) {
          return {
            data: null,
            error: { code: "NOT_FOUND", message: "Parent comment not found" },
          };
        }

        if (parentComment.post_id !== postId) {
          return {
            data: null,
            error: {
              code: "VALIDATION",
              message: "Cannot reply to a comment belonging to another post.",
            },
          };
        }

        if (parentComment.depth >= 11) {
          return {
            data: null,
            error: {
              code: "VALIDATION",
              message: "Maximum comment nesting depth (12 levels) reached.",
            },
          };
        }
      }

      const insertPayload: Record<string, any> = {
        post_id: postId,
        author_id: user.id,
        body: trimmedBody,
      };
      if (parentId) {
        insertPayload.parent_id = parentId;
      }
      if (images && images.length > 0) {
        insertPayload.image_urls = images;
      }

      const { data: inserted, error } = await supabase
        .from("comments")
        .insert(insertPayload)
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
        parentId: inserted.parent_id || null,
        depth: inserted.depth ?? 0,
        authorId: inserted.author_id,
        authorHandle: inserted.profiles?.handle || "Anonymous",
        authorAvatarUrl: inserted.profiles?.avatar_url || null,
        body: inserted.body,
        images: inserted.image_urls || [],
        upvotes: 0,
        downvotes: 0,
        createdAt: inserted.created_at,
        currentUserVote: null,
      };

      return { data: comment, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message },
      };
    }
  },

  async voteComment(commentId: string, voteValue: 1 | -1 | null): Promise<Result<{ upvotes: number; downvotes: number; currentUserVote: 1 | -1 | null }>> {
    return {
      data: { upvotes: 1, downvotes: 0, currentUserVote: voteValue },
      error: null,
    };
  },

  async getResources(subjectId: string, type: ResourceType): Promise<Result<ResourceNote[]>> {
    try {
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
