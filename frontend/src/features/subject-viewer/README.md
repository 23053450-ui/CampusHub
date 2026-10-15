# Feature Guide: Subject Editor & Document Viewer (`features/subject-viewer`)

The **Subject Viewer** feature provides the core study workspace for university courses. It incorporates the course resource/notes navigation tree and the center-pane multi-tab document/PDF viewer and text editor.

- **Frontend Path:** `frontend/src/features/subject-viewer/`
- **Backend Path:** *None* (Direct Supabase)
- **Primary Route:** `/subjects` and `/subjects/:subjectId`
- **Backend Services:** Supabase (`subjects`, `notes`, `subject-notes` bucket)

> [!IMPORTANT]
> **Feature Isolation & Shell Integration:**
> `subject-viewer` is fully isolated in its own feature folder. It does not import from `subject-ai-panel` (and vice-versa). The app shell layout ([`SubjectWorkspaceLayout.tsx`](../../app/layouts/SubjectWorkspaceLayout.tsx)) renders `SubjectViewerPage` as the left/center canvas of `/subjects/:subjectId`, while placing the AI companion panel in the right sidebar.

---

## 1. File & Directory Anatomy

```text
frontend/src/features/subject-viewer/
├── SubjectViewerPage.tsx     # Main page coordinator (renders tree and document viewer)
├── routes.tsx                # Route definition (/subjects and /subjects/:subjectId)
├── components/               # Sub-components isolated to the subject viewer
│   ├── ResourceTree.tsx      # Left pane: Unit/Day-wise notes, PYQs, and personal notes tree
│   ├── DocumentViewer.tsx    # Center pane: Multi-tab PDF and markdown viewer
│   ├── ViewerTabs.tsx        # Top tab-bar managing open note tabs
│   └── EditorToolbar.tsx     # Text highlighter, font scaler, and page navigation controls
├── services/                 # Data access layer
│   ├── types.ts              # SubjectViewerService interface & data contracts
│   ├── mockService.ts        # Mock implementation for offline UI construction
│   ├── realService.ts        # Supabase client queries & storage downloads
│   └── index.ts              # Active service switcher controlled by VITE_USE_MOCKS
└── README.md                 # This developer guide
```

---

## 2. Service Architecture & Mock vs Real Workflow

All data operations must be declared in `services/types.ts` and implemented in both `mockService.ts` and `realService.ts`.

### Step 1: Define Service Types (`services/types.ts`)
Declare your service interface and data contracts:
```typescript
import type { Result } from "@/shared/result";
import type { Subject } from "@/shared/user";

export interface SubjectNote {
  id: string;
  subjectId: string;
  title: string;
  tag: "Lecture" | "PYQ" | "Summary" | "My Notes";
  storagePath: string;
  contentUrl?: string;
}

export interface SubjectViewerService {
  getSubject(subjectId: string): Promise<Result<Subject>>;
  getNotesTree(subjectId: string): Promise<Result<SubjectNote[]>>;
  getNoteContent(storagePath: string): Promise<Result<Blob>>;
}
```

### Step 2: Implement Mock Service (`services/mockService.ts`)
Populate mock data and simulate network delay (300ms) so you can build the entire UI without needing a running Supabase database:
```typescript
import type { Result } from "@/shared/result";
import type { Subject } from "@/shared/user";
import type { SubjectViewerService, SubjectNote } from "./types";

export const mockSubjectViewerService: SubjectViewerService = {
  async getSubject(subjectId: string): Promise<Result<Subject>> {
    await new Promise((r) => setTimeout(r, 200));
    return { data: { id: subjectId, name: "Database Management Systems", code: "CS301" }, error: null };
  },
  async getNotesTree(subjectId: string): Promise<Result<SubjectNote[]>> {
    await new Promise((r) => setTimeout(r, 300));
    return {
      data: [
        { id: "note-1", subjectId, title: "Unit 1: ER Models", tag: "Lecture", storagePath: "notes/u1.pdf" },
        { id: "note-2", subjectId, title: "Unit 2: Normalization", tag: "Summary", storagePath: "notes/u2.pdf" },
      ],
      error: null,
    };
  },
  async getNoteContent(_path: string): Promise<Result<Blob>> {
    await new Promise((r) => setTimeout(r, 400));
    return { data: new Blob(["Sample note text content"], { type: "text/plain" }), error: null };
  },
};
```

### Step 3: Implement Real Service (`services/realService.ts`)
Connect directly to Supabase tables and storage buckets:
```typescript
import { supabase } from "@/lib/supabase";
import type { Result } from "@/shared/result";
import type { SubjectViewerService, SubjectNote } from "./types";

export const realSubjectViewerService: SubjectViewerService = {
  async getSubject(subjectId: string) {
    const { data, error } = await supabase.from("subjects").select("*").eq("id", subjectId).single();
    if (error) return { data: null, error: { code: "NOT_FOUND", message: error.message } };
    return { data, error: null };
  },
  async getNotesTree(subjectId: string) {
    const { data, error } = await supabase.from("notes").select("*").eq("subject_id", subjectId).eq("is_approved", true);
    if (error) return { data: null, error: { code: "INTERNAL", message: error.message } };
    return { data: data as SubjectNote[], error: null };
  },
  async getNoteContent(storagePath: string) {
    const { data, error } = await supabase.storage.from("subject-notes").download(storagePath);
    if (error) return { data: null, error: { code: "INTERNAL", message: error.message } };
    return { data, error: null };
  },
};
```

### Step 4: Dispatch in `services/index.ts`
Export the active service based on environment:
```typescript
import { mockSubjectViewerService } from "./mockService";
import { realSubjectViewerService } from "./realService";
import type { SubjectViewerService } from "./types";

export * from "./types";

const isMock = import.meta.env.VITE_USE_MOCKS === "true";
export const subjectViewerService: SubjectViewerService = isMock
  ? mockSubjectViewerService
  : realSubjectViewerService;
```

---

## 3. How to Develop

1. **Keep `VITE_USE_MOCKS=true`** in `frontend/.env`.
2. Open `SubjectViewerPage.tsx`. Use `subjectViewerService.getNotesTree(subjectId)` to fetch notes.
3. Build the left-pane `ResourceTree` using shadcn button or tree list primitives.
4. Build the center-pane `DocumentViewer` with tab management for switching between open notes.
5. Once UI interactions, tabs, and loading states are verified, switch `VITE_USE_MOCKS=false` to test against real Supabase tables.

---

## 4. How to Test

- **UI State Testing:** Verify loading skeletons when notes are fetched, empty state when no notes exist, and error alerts when a note fails to load.
- **Type Safety:** Run typecheck from `frontend/`:
  ```bash
  pnpm tsc --noEmit
  ```
- **Supabase Verification:** Upload sample PDF files to the `subject-notes` bucket in Supabase and confirm `download()` succeeds.
