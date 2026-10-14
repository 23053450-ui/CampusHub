import type { Post, Comment, Note, NoteTag, Result } from "@/types";
import type {
  CommunitiesService,
  CreatePostInput,
  CreateCommentInput,
  UploadNoteInput,
} from "./types";

const mockPosts: Post[] = [
  {
    id: "post-1",
    subjectId: "cs101",
    authorId: "user-1",
    authorHandle: "sarah_k",
    title: "Best approach for balancing AVL trees during deletion?",
    body: "I am struggling with the double rotation cases when deleting a node from an AVL tree. Does anyone have an intuitive mental model or diagram for RL and LR rotation triggers?",
    imageUrl: null,
    upvotes: 14,
    downvotes: 1,
    replyCount: 3,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    currentUserVote: null,
  },
  {
    id: "post-2",
    subjectId: "cs201",
    authorId: "user-2",
    authorHandle: "rahul_v",
    title: "BCNF vs 3NF: Practical trade-offs in real production databases",
    body: "When designing high-throughput relational schemas, do you strictly normalize up to BCNF, or intentionally stop at 3NF to avoid excessive joins across tables?",
    imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop",
    upvotes: 28,
    downvotes: 0,
    replyCount: 5,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    currentUserVote: 1,
  },
];

const mockComments: Comment[] = [
  {
    id: "comment-1",
    postId: "post-1",
    authorId: "user-3",
    authorHandle: "dev_dave",
    body: "Focus on the sign of the balance factor of the heavier child. If signs differ between parent and child, you always need a double rotation.",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "comment-2",
    postId: "post-1",
    authorId: "user-4",
    authorHandle: "alicia_m",
    body: "Here is a quick trick: LR = Left rotate the child, then Right rotate the parent.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const mockNotes: Note[] = [
  {
    id: "note-1",
    subjectId: "cs101",
    userId: "user-1",
    title: "Unit 3: Balanced Binary Search Trees & Heaps",
    description: "Complete lecture handwritten notes covering AVL, Red-Black Trees, and Min/Max heaps with time complexities.",
    storagePath: "subject-notes/cs101/unit3-trees.pdf",
    tag: "Lecture",
    isShared: true,
    isApproved: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "note-2",
    subjectId: "cs201",
    userId: "user-2",
    title: "DBMS Midterm Previous Year Questions (2022-2025)",
    description: "Compiled solved questions on Relational Algebra, SQL subqueries, and Normalization decompositions.",
    storagePath: "subject-notes/cs201/midterm-pyq.pdf",
    tag: "PYQ",
    isShared: true,
    isApproved: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export const mockCommunitiesService: CommunitiesService = {
  async getPosts(subjectId?: string): Promise<Result<Post[]>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const filtered = subjectId
      ? mockPosts.filter((p) => p.subjectId === subjectId)
      : mockPosts;
    return { data: [...filtered], error: null };
  },

  async createPost(input: CreatePostInput): Promise<Result<Post>> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const newPost: Post = {
      id: `post-${Date.now()}`,
      subjectId: input.subjectId,
      authorId: "mock-student-uuid",
      authorHandle: "alex_chen",
      title: input.title,
      body: input.body,
      imageUrl: input.imageFile ? URL.createObjectURL(input.imageFile) : null,
      upvotes: 0,
      downvotes: 0,
      replyCount: 0,
      createdAt: new Date().toISOString(),
      currentUserVote: null,
    };
    mockPosts.unshift(newPost);
    return { data: newPost, error: null };
  },

  async votePost(postId: string, voteValue: 1 | -1): Promise<Result<void>> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const post = mockPosts.find((p) => p.id === postId);
    if (post) {
      if (post.currentUserVote === voteValue) {
        // Toggle off
        if (voteValue === 1) post.upvotes = Math.max(0, post.upvotes - 1);
        if (voteValue === -1) post.downvotes = Math.max(0, post.downvotes - 1);
        post.currentUserVote = null;
      } else {
        if (post.currentUserVote === 1) post.upvotes = Math.max(0, post.upvotes - 1);
        if (post.currentUserVote === -1) post.downvotes = Math.max(0, post.downvotes - 1);

        if (voteValue === 1) post.upvotes += 1;
        if (voteValue === -1) post.downvotes += 1;
        post.currentUserVote = voteValue;
      }
    }
    return { data: undefined, error: null };
  },

  async getComments(postId: string): Promise<Result<Comment[]>> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const filtered = mockComments.filter((c) => c.postId === postId);
    return { data: [...filtered], error: null };
  },

  async createComment(input: CreateCommentInput): Promise<Result<Comment>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      postId: input.postId,
      authorId: "mock-student-uuid",
      authorHandle: "alex_chen",
      body: input.body,
      createdAt: new Date().toISOString(),
    };
    mockComments.push(newComment);
    const post = mockPosts.find((p) => p.id === input.postId);
    if (post) post.replyCount += 1;
    return { data: newComment, error: null };
  },

  async getNotes(subjectId?: string, tag?: NoteTag): Promise<Result<Note[]>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    let filtered = mockNotes;
    if (subjectId) filtered = filtered.filter((n) => n.subjectId === subjectId);
    if (tag) filtered = filtered.filter((n) => n.tag === tag);
    return { data: [...filtered], error: null };
  },

  async uploadNote(input: UploadNoteInput): Promise<Result<Note>> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newNote: Note = {
      id: `note-${Date.now()}`,
      subjectId: input.subjectId,
      userId: "mock-student-uuid",
      title: input.title,
      description: input.description || null,
      storagePath: `subject-notes/${input.subjectId}/${input.file.name}`,
      tag: input.tag,
      isShared: true,
      isApproved: true,
      createdAt: new Date().toISOString(),
    };
    mockNotes.unshift(newNote);
    return { data: newNote, error: null };
  },
};
