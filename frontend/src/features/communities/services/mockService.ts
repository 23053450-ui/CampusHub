/**
 * @file mockService.ts
 * @description In-memory mock implementation of CommunitiesService matching wireframes.
 * @owner Communities Team
 */

import type { Result } from "@/shared/result";
import type {
  CommunitiesService,
  SubjectForum,
  Post,
  Comment,
  ResourceNote,
  ResourceType,
} from "./types";

const INITIAL_SUBJECT_FORUMS: SubjectForum[] = [
  {
    id: "cs301",
    name: "Database Management Systems",
    code: "CS301",
    memberCount: 1200,
    isPinned: false,
    description: "Discussion forum and academic resource archive for DBMS course.",
  },
  {
    id: "cs302",
    name: "Computer Networks",
    code: "CS302",
    memberCount: 980,
    isPinned: false,
    description: "OSI stack, TCP/IP, routing protocols, and lab assignments.",
  },
  {
    id: "cs303",
    name: "Operating Systems",
    code: "CS303",
    memberCount: 1100,
    isPinned: false,
    description: "Concurrency, scheduling, memory paging, and Unix kernel calls.",
  },
  {
    id: "cs304",
    name: "Data Structures & Algorithms",
    code: "CS304",
    memberCount: 1540,
    isPinned: false,
    description: "Trees, graphs, dynamic programming, sorting, and complexity.",
  },
  {
    id: "ee101",
    name: "Basic Electrical Engineering",
    code: "EE101",
    memberCount: 850,
    isPinned: false,
    description: "Circuit analysis, AC/DC transients, transformers, and theorems.",
  },
  {
    id: "me102",
    name: "Engineering Graphics",
    code: "ME102",
    memberCount: 620,
    isPinned: true,
    description: "Orthographic projections, isometric views, and CAD models.",
  },
  {
    id: "cs305",
    name: "Design and Analysis of Algorithms",
    code: "CS305",
    memberCount: 950,
    isPinned: true,
    description: "Advanced algorithmic paradigms, NP-completeness, and greedy heuristics.",
  },
];

const INITIAL_POSTS: Post[] = [
  {
    id: "p1",
    subjectId: "cs301",
    authorId: "u1",
    authorHandle: "Brownbunny",
    authorAvatarUrl: null,
    title: "Does anyone have extra questions from Mr. XYZ for midsem?",
    body: "I heard Mr. XYZ shared a set of 15 practice questions on B+ Trees and normalization in yesterday's tutorial. Can someone please share the handout or questions here?",
    imageUrl: null,
    upvotes: 17,
    downvotes: 0,
    replyCount: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    currentUserVote: null,
  },
  {
    id: "p2",
    subjectId: "cs301",
    authorId: "u2",
    authorHandle: "Hashpotato",
    authorAvatarUrl: null,
    title: "Is Q.4 from this assignment 4 (CSE-12) wrong here?",
    body: "In question 4 of assignment 4 regarding 2PL concurrency control, the conflict serializability graph produces a cycle if T2 reads before T1 finishes. Isn't that an inconsistency in the question statement?",
    imageUrl: null,
    upvotes: 23,
    downvotes: 0,
    replyCount: 13,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    currentUserVote: null,
  },
  {
    id: "p3",
    subjectId: "cs302",
    authorId: "u3",
    authorHandle: "CodeCrafter",
    authorAvatarUrl: null,
    title: "Subnetting cheat sheet for CIDR /26 and /28",
    body: "Put together a quick table to calculate network and broadcast addresses on the fly for tomorrow's lab quiz.",
    imageUrl: null,
    upvotes: 31,
    downvotes: 1,
    replyCount: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    currentUserVote: null,
  },
];

const INITIAL_COMMENTS: Comment[] = [
  {
    id: "c1",
    postId: "p1",
    authorId: "u4",
    authorHandle: "QuantumDev",
    authorAvatarUrl: null,
    body: "Check the Resources tab under Notes! I uploaded the tutorial 4 worksheet there.",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "c2",
    postId: "p1",
    authorId: "u2",
    authorHandle: "Hashpotato",
    authorAvatarUrl: null,
    body: "Yes, questions 8 and 12 were specifically emphasized for the midsem paper.",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "c3",
    postId: "p2",
    authorId: "u5",
    authorHandle: "ByteMe",
    authorAvatarUrl: null,
    body: "You're right! Prof mentioned in Section B that T2 should be a Read-only transaction instead of Read-Write.",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

const INITIAL_RESOURCES: ResourceNote[] = [
  // Notes
  {
    id: "n1",
    subjectId: "cs301",
    title: "Day1-ABCD.pdf",
    type: "Note",
    category: "Day wise",
    uploaderHandle: "Hashpotato",
    pageCount: 24,
    storagePath: "notes/cs301/day1-abcd.pdf",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: "n2",
    subjectId: "cs301",
    title: "Day2-ABCD.pdf",
    type: "Note",
    category: "Day wise",
    uploaderHandle: "Hashpotato",
    pageCount: 21,
    storagePath: "notes/cs301/day2-abcd.pdf",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "n3",
    subjectId: "cs301",
    title: "Day3-ABCD.pdf",
    type: "Note",
    category: "Day wise",
    uploaderHandle: "Hashpotato",
    pageCount: 18,
    storagePath: "notes/cs301/day3-abcd.pdf",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: "n4",
    subjectId: "cs301",
    title: "Day4-ABCD.pdf",
    type: "Note",
    category: "Day wise",
    uploaderHandle: "Hashpotato",
    pageCount: 13,
    storagePath: "notes/cs301/day4-abcd.pdf",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: "n5",
    subjectId: "cs301",
    title: "Unit 2 - Relational Algebra & SQL Complete.pdf",
    type: "Note",
    category: "Unit wise",
    uploaderHandle: "Brownbunny",
    pageCount: 38,
    storagePath: "notes/cs301/unit2-relational-algebra.pdf",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "n6",
    subjectId: "cs301",
    title: "Transactions Cheat Sheet.pdf",
    type: "Note",
    category: "Other",
    uploaderHandle: "QuantumDev",
    pageCount: 6,
    storagePath: "notes/cs301/transactions-cheatsheet.pdf",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },

  // PYQs
  {
    id: "q1",
    subjectId: "cs301",
    title: "2021 End sem.pdf",
    type: "PYQ",
    category: "Other",
    uploaderHandle: "Hashpotato",
    pageCount: 4,
    storagePath: "pyqs/cs301/2021-endsem.pdf",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: "q2",
    subjectId: "cs301",
    title: "2021 Mid sem.pdf",
    type: "PYQ",
    category: "Other",
    uploaderHandle: "Hashpotato",
    pageCount: 2,
    storagePath: "pyqs/cs301/2021-midsem.pdf",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "q3",
    subjectId: "cs301",
    title: "2022 End sem.pdf",
    type: "PYQ",
    category: "Other",
    uploaderHandle: "Hashpotato",
    pageCount: 3,
    storagePath: "pyqs/cs301/2022-endsem.pdf",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: "q4",
    subjectId: "cs301",
    title: "2022 Mid sem.pdf",
    type: "PYQ",
    category: "Other",
    uploaderHandle: "Hashpotato",
    pageCount: 1,
    storagePath: "pyqs/cs301/2022-midsem.pdf",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
];

// In-memory state
let subjectForums = [...INITIAL_SUBJECT_FORUMS];
let posts = [...INITIAL_POSTS];
let comments = [...INITIAL_COMMENTS];
let resources = [...INITIAL_RESOURCES];

export const mockCommunitiesService: CommunitiesService = {
  async getSubjectForums(): Promise<Result<SubjectForum[]>> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { data: [...subjectForums], error: null };
  },

  async getPosts(subjectId: string, sort: "new" | "top" | "hot" = "new"): Promise<Result<Post[]>> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    let filtered = posts.filter((p) => p.subjectId === subjectId);

    if (sort === "top") {
      filtered = [...filtered].sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes));
    } else if (sort === "hot") {
      filtered = [...filtered].sort((a, b) => b.replyCount + b.upvotes - (a.replyCount + a.upvotes));
    } else {
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return { data: filtered, error: null };
  },

  async createPost(data): Promise<Result<Post>> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const newPost: Post = {
      id: `p-${Date.now()}`,
      subjectId: data.subjectId,
      authorId: "mock-student",
      authorHandle: "Hashpotato",
      authorAvatarUrl: null,
      title: data.title,
      body: data.body,
      imageUrl: data.imageUrl || null,
      upvotes: 1,
      downvotes: 0,
      replyCount: 0,
      createdAt: new Date().toISOString(),
      currentUserVote: 1,
    };
    posts = [newPost, ...posts];
    return { data: newPost, error: null };
  },

  async votePost(postId: string, voteValue: 1 | -1 | null): Promise<Result<{ upvotes: number; downvotes: number; currentUserVote: 1 | -1 | null }>> {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const postIndex = posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) {
      return {
        data: null,
        error: { code: "NOT_FOUND", message: "Post not found" },
      };
    }

    const post = posts[postIndex];
    const prevVote = post.currentUserVote;

    let upvotes = post.upvotes;
    let downvotes = post.downvotes;

    // Remove previous vote if existed
    if (prevVote === 1) upvotes = Math.max(0, upvotes - 1);
    if (prevVote === -1) downvotes = Math.max(0, downvotes - 1);

    // Apply new vote
    if (voteValue === 1) upvotes += 1;
    if (voteValue === -1) downvotes += 1;

    posts[postIndex] = {
      ...post,
      upvotes,
      downvotes,
      currentUserVote: voteValue,
    };

    return {
      data: { upvotes, downvotes, currentUserVote: voteValue },
      error: null,
    };
  },

  async getComments(postId: string): Promise<Result<Comment[]>> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const postComments = comments
      .filter((c) => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return { data: postComments, error: null };
  },

  async createComment(postId: string, body: string): Promise<Result<Comment>> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      postId,
      authorId: "mock-student",
      authorHandle: "Hashpotato",
      authorAvatarUrl: null,
      body,
      createdAt: new Date().toISOString(),
    };
    comments = [...comments, newComment];

    // Increment reply count on post
    const postIndex = posts.findIndex((p) => p.id === postId);
    if (postIndex !== -1) {
      posts[postIndex] = {
        ...posts[postIndex],
        replyCount: posts[postIndex].replyCount + 1,
      };
    }

    return { data: newComment, error: null };
  },

  async getResources(subjectId: string, type: ResourceType): Promise<Result<ResourceNote[]>> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const filtered = resources
      .filter((r) => r.subjectId === subjectId && r.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { data: filtered, error: null };
  },

  async uploadResource(data): Promise<Result<ResourceNote>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newResource: ResourceNote = {
      id: `r-${Date.now()}`,
      subjectId: data.subjectId,
      title: data.title,
      type: data.type,
      category: data.category || "Other",
      uploaderHandle: "Hashpotato",
      pageCount: data.pageCount || (Math.floor(Math.random() * 20) + 2),
      storagePath: `resources/${data.subjectId}/${data.title}`,
      createdAt: new Date().toISOString(),
    };
    resources = [newResource, ...resources];
    return { data: newResource, error: null };
  },
};
