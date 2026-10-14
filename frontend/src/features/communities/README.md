# Feature Guide: Communities (`features/communities`)

**Scope:** Unified community domain combining:
1. **Discussions (Forum):** Subject-based discussion threads, post creation with images, comments, and atomic upvoting/downvoting (`vote_post` RPC).
2. **Academic Resources Archive:** Subject notes, PYQs, lecture summaries, PDF uploads (up to 5 MiB in `subject-notes` bucket).

**Frontend Routes:** `/communities` and `/communities/:subjectId`  
**Data Dependency:** Direct **Supabase** (`posts`, `comments`, `notes`, `subject-notes`, `public-attachments`).

---

## 1. Developer Ownership

- **Your Workspace:** `frontend/src/features/communities/`
- **Main Component:** `CommunitiesPage.tsx`
- **Service Layer:** `services/`
  - `services/types.ts` — `CommunitiesService` interface with full CRUD and RPC contracts.
  - `services/mockService.ts` — Mock discussion feed, replies, vote counters, and resources.
  - `services/realService.ts` — Production Supabase queries, RPC calls, and bucket uploads.
  - `services/index.ts` — Automatic dispatcher controlled by `VITE_USE_MOCKS`.

---

## 2. Recommended Directory Breakdown

```text
src/features/communities/
├── components/
│   ├── forum/              # PostCard, PostFeed, ThreadComments, PostComposer
│   └── resources/          # ResourceTable, NoteCard, UploadModal, TagFilters
├── services/               # Mock and Real service abstractions
│   ├── types.ts
│   ├── mockService.ts
│   ├── realService.ts
│   └── index.ts
├── CommunitiesPage.tsx     # Tabbed view: "Discussions" & "Resources"
└── README.md
```

---

## 3. Mock-First Development Workflow

### Step 1: Build the UI with Mock Services
1. Ensure `VITE_USE_MOCKS=true` in `frontend/.env`.
2. Inspect or customize mock posts and notes in [`services/mockService.ts`](services/mockService.ts).
3. Import and use `communitiesService` in your components:
   ```typescript
   import { communitiesService } from "./services";

   // Fetch forum posts:
   const { data: posts, error } = await communitiesService.getPosts(subjectId);

   // Upvote or downvote:
   await communitiesService.votePost(post.id, 1);

   // Upload resource:
   await communitiesService.uploadNote({ subjectId, title, tag, file });
   ```
4. Build the two-tabbed UI ("Discussions" and "Resources") completely.

### Step 2: Implement Real Supabase Calls
When your components look and feel great:
1. Open [`services/realService.ts`](services/realService.ts).
2. Inspect the pre-configured Supabase queries:
   - **Discussions:** Queries `posts` joined with `profiles!inner(handle)`.
   - **Voting:** Calls `supabase.rpc("vote_post", { p_post_id, p_vote_value })`.
   - **Image Upload:** Uploads to `public-attachments` bucket under `{userId}/{timestamp}-{fileName}`.
   - **Notes Upload:** Uploads to `subject-notes` bucket under `{userId}/{timestamp}-{fileName}`.
3. Switch `VITE_USE_MOCKS=false` in `.env`. Your UI will now run directly against the live Supabase instance!
