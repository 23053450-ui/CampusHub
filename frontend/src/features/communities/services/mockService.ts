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
    imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "cs302",
    name: "Computer Networks",
    code: "CS302",
    memberCount: 980,
    isPinned: false,
    description: "OSI stack, TCP/IP, routing protocols, and lab assignments.",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "cs303",
    name: "Operating Systems",
    code: "CS303",
    memberCount: 1100,
    isPinned: false,
    description: "Concurrency, scheduling, memory paging, and Unix kernel calls.",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "cs304",
    name: "Data Structures & Algorithms",
    code: "CS304",
    memberCount: 1540,
    isPinned: false,
    description: "Trees, graphs, dynamic programming, sorting, and complexity.",
    imageUrl: "https://images.unsplash.com/photo-1516116211227-bbc6732f790c?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "ee101",
    name: "Basic Electrical Engineering",
    code: "EE101",
    memberCount: 850,
    isPinned: false,
    description: "Circuit analysis, AC/DC transients, transformers, and theorems.",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "me102",
    name: "Engineering Graphics",
    code: "ME102",
    memberCount: 620,
    isPinned: true,
    description: "Orthographic projections, isometric views, and CAD models.",
    imageUrl: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "cs305",
    name: "Design and Analysis of Algorithms",
    code: "CS305",
    memberCount: 950,
    isPinned: true,
    description: "Advanced algorithmic paradigms, NP-completeness, and greedy heuristics.",
    imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=100&auto=format&fit=crop&q=80",
  },
];

const INITIAL_POSTS: Post[] = [
  {
    id: "p1",
    subjectId: "cs301",
    authorId: "u1",
    authorHandle: "Brownbunny",
    authorAvatarUrl: null,
    title: "Hi, my friend asked me how to solve this problem, can anyone explain me how to find the answer",
    body: "It has been a long time since I've done any geometry so I don't remember anymore how to find x in that angle, could anyone explain how to get to the answer and the steps to find it? Thank you so much!",
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
    ],
    upvotes: 17,
    downvotes: 0,
    replyCount: 14,
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
    imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    ],
    upvotes: 23,
    downvotes: 0,
    replyCount: 3,
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
    images: [],
    upvotes: 31,
    downvotes: 1,
    replyCount: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    currentUserVote: null,
  },
  {
    id: "p4",
    subjectId: "cs301",
    authorId: "u4",
    authorHandle: "CampusDev",
    authorAvatarUrl: null,
    title: "Quick reminder: Midsem schedule changed for CS301 tutorial slot!",
    body: "", // Optional body demo
    imageUrl: null,
    images: [],
    upvotes: 12,
    downvotes: 0,
    replyCount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    currentUserVote: null,
  },
  {
    id: "p-me1",
    subjectId: "me102",
    authorId: "u-me1",
    authorHandle: "CadMaster",
    authorAvatarUrl: null,
    title: "Isometric vs Orthographic Projection: Summary sheet for Unit 2 exam",
    body: "Here is a quick reference guide on converting first-angle to third-angle projection and calculating missing isometric views for tomorrow's revision.",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    ],
    upvotes: 34,
    downvotes: 0,
    replyCount: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    currentUserVote: null,
  },
  {
    id: "p-me2",
    subjectId: "me102",
    authorId: "u-me2",
    authorHandle: "DraftingPro",
    authorAvatarUrl: null,
    title: "How to construct a parabola using the rectangle and tangent method?",
    body: "Struggling with step 3 in sheet 4 where the vertex touches the auxiliary axis. Can someone check my construction lines?",
    imageUrl: null,
    images: [],
    upvotes: 19,
    downvotes: 1,
    replyCount: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    currentUserVote: null,
  },
  {
    id: "p-me3",
    subjectId: "me102",
    authorId: "u-me3",
    authorHandle: "TechDraw99",
    authorAvatarUrl: null,
    title: "AutoCAD 2024 Lab shortcut key cheatsheet",
    body: "Handy shortcuts for drafting, snap tracking, chamfer, and fillet commands for tomorrow's practical evaluation.",
    imageUrl: null,
    images: [],
    upvotes: 45,
    downvotes: 0,
    replyCount: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    currentUserVote: null,
  },
  {
    id: "p-me4",
    subjectId: "me102",
    authorId: "u-me4",
    authorHandle: "SolidModeler",
    authorAvatarUrl: null,
    title: "Section of Solids: True shape vs Apparent shape explained",
    body: "A lot of students got confused on the cylinder cut by an inclined plane in tutorial 3. Here is the breakdown of why the true shape is an ellipse.",
    imageUrl: null,
    images: [],
    upvotes: 27,
    downvotes: 0,
    replyCount: 4,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    currentUserVote: null,
  },
  {
    id: "p-os1",
    subjectId: "cs303",
    authorId: "u-os1",
    authorHandle: "KernelHacker",
    authorAvatarUrl: null,
    title: "Deadlock Banker's Algorithm solved step-by-step with safety state check",
    body: "Detailed example walkthrough calculating Need matrix, Available vector, and safe execution sequences.",
    imageUrl: null,
    images: [],
    upvotes: 42,
    downvotes: 0,
    replyCount: 9,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    currentUserVote: null,
  },
  {
    id: "p-dsa1",
    subjectId: "cs304",
    authorId: "u-dsa1",
    authorHandle: "AlgoExpert",
    authorAvatarUrl: null,
    title: "Dijkstra vs Bellman-Ford: When to choose which shortest path algorithm?",
    body: "Comprehensive comparison table focusing on negative cycles, time complexities, and typical interview edge cases.",
    imageUrl: null,
    images: [],
    upvotes: 38,
    downvotes: 1,
    replyCount: 7,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(),
    currentUserVote: null,
  },
];

const INITIAL_COMMENTS: Comment[] = [
  // Top-level comment for post p1 (Level 1, depth 0)
  {
    id: "c1",
    postId: "p1",
    parentId: null,
    depth: 0,
    authorId: "u4",
    authorHandle: "QuantumDev",
    authorAvatarUrl: null,
    body: "The angle sum of the right triangles around the squares gives you the required angle. Notice that the squares have internal 90° angles.",
    upvotes: 12,
    downvotes: 0,
    currentUserVote: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
  },
  // Level 2 reply (depth 1)
  {
    id: "c1-1",
    postId: "p1",
    parentId: "c1",
    depth: 1,
    authorId: "u1",
    authorHandle: "Brownbunny",
    authorAvatarUrl: null,
    body: "Thanks! So for the middle square (乙), the two adjacent angles are 128° and the square corner (90°)?",
    upvotes: 5,
    downvotes: 0,
    currentUserVote: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
  // Level 3 reply (depth 2)
  {
    id: "c1-2",
    postId: "p1",
    parentId: "c1-1",
    depth: 2,
    authorId: "u4",
    authorHandle: "QuantumDev",
    authorAvatarUrl: null,
    body: "Exactly. The full revolution around that vertex is 360°. So subtracting those gives you the inside angle.",
    upvotes: 4,
    downvotes: 0,
    currentUserVote: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
  },
  // Level 4 reply (depth 3)
  {
    id: "c1-3",
    postId: "p1",
    parentId: "c1-2",
    depth: 3,
    authorId: "u5",
    authorHandle: "MathEnthusiast",
    authorAvatarUrl: null,
    body: "360 - 128 - 90 = 142° for that interior segment.",
    upvotes: 3,
    downvotes: 0,
    currentUserVote: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  // Level 5 reply (depth 4)
  {
    id: "c1-4",
    postId: "p1",
    parentId: "c1-3",
    depth: 4,
    authorId: "u1",
    authorHandle: "Brownbunny",
    authorAvatarUrl: null,
    body: "Then we carry that down to square 丙?",
    upvotes: 2,
    downvotes: 0,
    currentUserVote: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
  },
  // Level 6 reply (depth 5)
  {
    id: "c1-5",
    postId: "p1",
    parentId: "c1-4",
    depth: 5,
    authorId: "u5",
    authorHandle: "MathEnthusiast",
    authorAvatarUrl: null,
    body: "Yes! Use the 34° given at the vertex between 乙 and 丙.",
    upvotes: 2,
    downvotes: 0,
    currentUserVote: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 100).toISOString(),
  },
  // Level 7 reply (depth 6)
  {
    id: "c1-6",
    postId: "p1",
    parentId: "c1-5",
    depth: 6,
    authorId: "u6",
    authorHandle: "GeometryWhiz",
    authorAvatarUrl: null,
    body: "The angle between the squares is complementary because of the straight line reference on the left.",
    upvotes: 2,
    downvotes: 0,
    currentUserVote: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  // Level 8 reply (depth 7)
  {
    id: "c1-7",
    postId: "p1",
    parentId: "c1-6",
    depth: 7,
    authorId: "u1",
    authorHandle: "Brownbunny",
    authorAvatarUrl: null,
    body: "I see! Does that mean x is 56°?",
    upvotes: 2,
    downvotes: 0,
    currentUserVote: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
  },
  // Level 9 reply (depth 8)
  {
    id: "c1-8",
    postId: "p1",
    parentId: "c1-7",
    depth: 8,
    authorId: "u6",
    authorHandle: "GeometryWhiz",
    authorAvatarUrl: null,
    body: "Almost, check the 90° angle at the bottom corner of the bounding box.",
    upvotes: 1,
    downvotes: 0,
    currentUserVote: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
  },
  // Level 10 reply (depth 9)
  {
    id: "c1-9",
    postId: "p1",
    parentId: "c1-8",
    depth: 9,
    authorId: "u1",
    authorHandle: "Brownbunny",
    authorAvatarUrl: null,
    body: "Right, subtracting 34° from 90° gives 56°, then taking the supplementary angle...",
    upvotes: 1,
    downvotes: 0,
    currentUserVote: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  // Level 11 reply (depth 10)
  {
    id: "c1-10",
    postId: "p1",
    parentId: "c1-9",
    depth: 10,
    authorId: "u6",
    authorHandle: "GeometryWhiz",
    authorAvatarUrl: null,
    body: "You got it! 64° is the final result for x.",
    upvotes: 3,
    downvotes: 0,
    currentUserVote: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
  // Level 12 reply (depth 11 - STRICT CEILING)
  {
    id: "c1-11",
    postId: "p1",
    parentId: "c1-10",
    depth: 11,
    authorId: "u1",
    authorHandle: "Brownbunny",
    authorAvatarUrl: null,
    body: "Awesome! That matches the answer key in the tutorial sheet. Thank you everyone!",
    upvotes: 4,
    downvotes: 0,
    currentUserVote: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
  // Another top-level comment for p1 (depth 0)
  {
    id: "c2",
    postId: "p1",
    parentId: null,
    depth: 0,
    authorId: "u2",
    authorHandle: "Hashpotato",
    authorAvatarUrl: null,
    body: "I uploaded the tutorial worksheet solution to the Resources tab under Notes!",
    upvotes: 8,
    downvotes: 0,
    currentUserVote: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  // Comments for p2
  {
    id: "c3",
    postId: "p2",
    parentId: null,
    authorId: "u5",
    authorHandle: "ByteMe",
    authorAvatarUrl: null,
    body: "You're right! Prof mentioned in Section B that T2 should be a Read-only transaction instead of Read-Write.",
    upvotes: 6,
    downvotes: 0,
    currentUserVote: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

const INITIAL_RESOURCES: ResourceNote[] = [
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
    id: "q1",
    subjectId: "cs301",
    title: "2023 End sem.pdf",
    type: "PYQ",
    category: "Other",
    uploaderHandle: "Hashpotato",
    pageCount: 2,
    storagePath: "pyqs/cs301/2023-endsem.pdf",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
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

  async getPosts(subjectId: string, sort: "new" | "top" | "hot" = "new", search?: string): Promise<Result<Post[]>> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    let filtered = posts.filter((p) => p.subjectId === subjectId);

    if (search && search.trim()) {
      const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
      filtered = filtered.filter((post) => {
        const titleLower = post.title.toLowerCase();
        return terms.every((term) => titleLower.includes(term));
      });
    }

    if (sort === "top") {
      filtered = [...filtered].sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes));
    } else if (sort === "hot") {
      filtered = [...filtered].sort((a, b) => b.replyCount + b.upvotes - (a.replyCount + a.upvotes));
    } else {
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return { data: filtered, error: null };
  },

  async getPost(postId: string): Promise<Result<Post>> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const post = posts.find((p) => p.id === postId);
    if (!post) {
      return { data: null, error: { code: "NOT_FOUND", message: "Post not found" } };
    }
    return { data: post, error: null };
  },

  async createPost(data): Promise<Result<Post>> {
    await new Promise((resolve) => setTimeout(resolve, 250));

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

    const newPost: Post = {
      id: `p-${Date.now()}`,
      subjectId: data.subjectId,
      authorId: "mock-student",
      authorHandle: "Hashpotato",
      authorAvatarUrl: null,
      title: trimmedTitle,
      body: data.body ? data.body.trim() : "",
      imageUrl: images[0] || null,
      images: images,
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

  async createComment(
    postId: string,
    body: string,
    parentId?: string | null,
    images?: string[]
  ): Promise<Result<Comment>> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 1. Validation: Body length between 1 and 2000 chars
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

    // 2. Validation: Max 2 images per comment
    if (images && images.length > 2) {
      return {
        data: null,
        error: {
          code: "VALIDATION",
          message: "A comment reply can attach at most 2 images.",
        },
      };
    }

    let calculatedDepth = 0;

    // 3. Parent validations and depth ceiling
    if (parentId) {
      const parent = comments.find((c) => c.id === parentId);
      if (!parent) {
        return {
          data: null,
          error: { code: "NOT_FOUND", message: "Parent comment not found." },
        };
      }

      // Cross-post hijacking prevention
      if (parent.postId !== postId) {
        return {
          data: null,
          error: {
            code: "VALIDATION",
            message: "Cannot reply to a comment belonging to another post.",
          },
        };
      }

      // 12-level ceiling check: 0-indexed depths 0..11 = 12 levels.
      // Replying to depth 11 would yield depth 12 (13th level), which is strictly forbidden.
      const parentDepth = parent.depth ?? 0;
      if (parentDepth >= 11) {
        return {
          data: null,
          error: {
            code: "VALIDATION",
            message: "Maximum comment nesting depth (12 levels) reached.",
          },
        };
      }

      calculatedDepth = parentDepth + 1;
    }

    const newComment: Comment = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      postId,
      parentId: parentId || null,
      depth: calculatedDepth,
      authorId: "mock-student",
      authorHandle: "Hashpotato",
      authorAvatarUrl: null,
      body: trimmedBody,
      images: images || [],
      upvotes: 1,
      downvotes: 0,
      currentUserVote: 1,
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

  async voteComment(commentId: string, voteValue: 1 | -1 | null): Promise<Result<{ upvotes: number; downvotes: number; currentUserVote: 1 | -1 | null }>> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const commentIndex = comments.findIndex((c) => c.id === commentId);
    if (commentIndex === -1) {
      return { data: null, error: { code: "NOT_FOUND", message: "Comment not found" } };
    }

    const comment = comments[commentIndex];
    const prevVote = comment.currentUserVote;
    let upvotes = comment.upvotes ?? 0;
    let downvotes = comment.downvotes ?? 0;

    if (prevVote === 1) upvotes = Math.max(0, upvotes - 1);
    if (prevVote === -1) downvotes = Math.max(0, downvotes - 1);

    if (voteValue === 1) upvotes += 1;
    if (voteValue === -1) downvotes += 1;

    comments[commentIndex] = {
      ...comment,
      upvotes,
      downvotes,
      currentUserVote: voteValue,
    };

    return {
      data: { upvotes, downvotes, currentUserVote: voteValue },
      error: null,
    };
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
