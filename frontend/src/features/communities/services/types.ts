import type { Post, Comment, Note, NoteTag, Result } from "@/types";

export interface CreatePostInput {
  subjectId: string;
  title: string;
  body: string;
  imageFile?: File;
}

export interface CreateCommentInput {
  postId: string;
  body: string;
}

export interface UploadNoteInput {
  subjectId: string;
  title: string;
  tag: NoteTag;
  file: File;
  description?: string;
}

export interface CommunitiesService {
  getPosts(subjectId?: string): Promise<Result<Post[]>>;
  createPost(input: CreatePostInput): Promise<Result<Post>>;
  votePost(postId: string, voteValue: 1 | -1): Promise<Result<void>>;
  getComments(postId: string): Promise<Result<Comment[]>>;
  createComment(input: CreateCommentInput): Promise<Result<Comment>>;
  getNotes(subjectId?: string, tag?: NoteTag): Promise<Result<Note[]>>;
  uploadNote(input: UploadNoteInput): Promise<Result<Note>>;
}
