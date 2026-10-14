import { supabase } from "@/lib/supabase";
import type { Post, Comment, Note, NoteTag, Result } from "@/types";
import type {
  CommunitiesService,
  CreatePostInput,
  CreateCommentInput,
  UploadNoteInput,
} from "./types";

export const realCommunitiesService: CommunitiesService = {
  async getPosts(subjectId?: string): Promise<Result<Post[]>> {
    try {
      let query = supabase
        .from("posts")
        .select(`
          id,
          subject_id,
          author_id,
          title,
          body,
          image_url,
          upvotes,
          downvotes,
          reply_count,
          created_at,
          profiles!inner(handle)
        `)
        .order("created_at", { ascending: false });

      if (subjectId) {
        query = query.eq("subject_id", subjectId);
      }

      const { data, error } = await query;
      if (error) {
        return { data: null, error: { code: "INTERNAL", message: error.message, details: error } };
      }

      const posts: Post[] = (data || []).map((p: any) => ({
        id: p.id,
        subjectId: p.subject_id,
        authorId: p.author_id,
        authorHandle: p.profiles?.handle || "student",
        title: p.title,
        body: p.body,
        imageUrl: p.image_url,
        upvotes: p.upvotes || 0,
        downvotes: p.downvotes || 0,
        replyCount: p.reply_count || 0,
        createdAt: p.created_at,
        currentUserVote: null,
      }));

      return { data: posts, error: null };
    } catch (err: any) {
      return { data: null, error: { code: "NETWORK", message: err?.message || "Failed to fetch posts" } };
    }
  },

  async createPost(input: CreatePostInput): Promise<Result<Post>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { code: "UNAUTHENTICATED", message: "User not authenticated" } };
      }

      let imageUrl: string | null = null;
      if (input.imageFile) {
        const filePath = `${user.id}/${Date.now()}-${input.imageFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("public-attachments")
          .upload(filePath, input.imageFile);

        if (uploadErr) {
          return { data: null, error: { code: "INTERNAL", message: uploadErr.message, details: uploadErr } };
        }

        const { data: publicUrlData } = supabase.storage
          .from("public-attachments")
          .getPublicUrl(filePath);
        imageUrl = publicUrlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("posts")
        .insert({
          subject_id: input.subjectId,
          author_id: user.id,
          title: input.title,
          body: input.body,
          image_url: imageUrl,
        })
        .select("*, profiles!inner(handle)")
        .single();

      if (error) {
        return { data: null, error: { code: "INTERNAL", message: error.message, details: error } };
      }

      const created: Post = {
        id: data.id,
        subjectId: data.subject_id,
        authorId: data.author_id,
        authorHandle: data.profiles?.handle || "student",
        title: data.title,
        body: data.body,
        imageUrl: data.image_url,
        upvotes: 0,
        downvotes: 0,
        replyCount: 0,
        createdAt: data.created_at,
        currentUserVote: null,
      };

      return { data: created, error: null };
    } catch (err: any) {
      return { data: null, error: { code: "NETWORK", message: err?.message || "Failed to create post" } };
    }
  },

  async votePost(postId: string, voteValue: 1 | -1): Promise<Result<void>> {
    try {
      const { error } = await supabase.rpc("vote_post", {
        p_post_id: postId,
        p_vote_value: voteValue,
      });

      if (error) {
        return { data: null, error: { code: "INTERNAL", message: error.message, details: error } };
      }

      return { data: undefined, error: null };
    } catch (err: any) {
      return { data: null, error: { code: "NETWORK", message: err?.message || "Failed to vote on post" } };
    }
  },

  async getComments(postId: string): Promise<Result<Comment[]>> {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          post_id,
          author_id,
          body,
          created_at,
          profiles!inner(handle)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        return { data: null, error: { code: "INTERNAL", message: error.message, details: error } };
      }

      const comments: Comment[] = (data || []).map((c: any) => ({
        id: c.id,
        postId: c.post_id,
        authorId: c.author_id,
        authorHandle: c.profiles?.handle || "student",
        body: c.body,
        createdAt: c.created_at,
      }));

      return { data: comments, error: null };
    } catch (err: any) {
      return { data: null, error: { code: "NETWORK", message: err?.message || "Failed to fetch comments" } };
    }
  },

  async createComment(input: CreateCommentInput): Promise<Result<Comment>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { code: "UNAUTHENTICATED", message: "User not authenticated" } };
      }

      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: input.postId,
          author_id: user.id,
          body: input.body,
        })
        .select("*, profiles!inner(handle)")
        .single();

      if (error) {
        return { data: null, error: { code: "INTERNAL", message: error.message, details: error } };
      }

      const created: Comment = {
        id: data.id,
        postId: data.post_id,
        authorId: data.author_id,
        authorHandle: data.profiles?.handle || "student",
        body: data.body,
        createdAt: data.created_at,
      };

      return { data: created, error: null };
    } catch (err: any) {
      return { data: null, error: { code: "NETWORK", message: err?.message || "Failed to post comment" } };
    }
  },

  async getNotes(subjectId?: string, tag?: NoteTag): Promise<Result<Note[]>> {
    try {
      let query = supabase.from("notes").select("*").order("created_at", { ascending: false });

      if (subjectId) query = query.eq("subject_id", subjectId);
      if (tag) query = query.eq("tag", tag);

      const { data, error } = await query;
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
      return { data: null, error: { code: "NETWORK", message: err?.message || "Failed to fetch notes" } };
    }
  },

  async uploadNote(input: UploadNoteInput): Promise<Result<Note>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { code: "UNAUTHENTICATED", message: "User not authenticated" } };
      }

      const storagePath = `${user.id}/${Date.now()}-${input.file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("subject-notes")
        .upload(storagePath, input.file);

      if (uploadErr) {
        return { data: null, error: { code: "INTERNAL", message: uploadErr.message, details: uploadErr } };
      }

      const { data, error } = await supabase
        .from("notes")
        .insert({
          subject_id: input.subjectId,
          user_id: user.id,
          title: input.title,
          description: input.description,
          storage_path: storagePath,
          tag: input.tag,
          is_shared: true,
          is_approved: false, // Default to pending approval if required
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: { code: "INTERNAL", message: error.message, details: error } };
      }

      const note: Note = {
        id: data.id,
        subjectId: data.subject_id,
        userId: data.user_id,
        title: data.title,
        description: data.description,
        storagePath: data.storage_path,
        tag: data.tag,
        isShared: data.is_shared,
        isApproved: data.is_approved,
        createdAt: data.created_at,
      };

      return { data: note, error: null };
    } catch (err: any) {
      return { data: null, error: { code: "NETWORK", message: err?.message || "Failed to upload note" } };
    }
  },
};
