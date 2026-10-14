# Feature Guide: Subject Workspace (`features/subjects`)

**Scope:** The 3-Pane study workspace for enrolled courses (`/subjects/:subjectId`).  
**Data Dependencies:**
- Course notes tree & enrollments via **Supabase**.
- AI Study Companion via **FastAPI** (`/api/v1/subjects-ai/*`).

---

## 1. 3-Pane Workspace Layout

```text
+-----------------------------------------------------------------------------------------+
| Subject Header: CS301 Database Management Systems                                       |
+--------------------------+---------------------------------+----------------------------+
| Left Pane: Resource Tree | Center Pane: Document Viewer    | Right Pane: AI Companion   |
| - Unit/Day-wise notes    | - Multi-tab PDF/Markdown viewer | - Chat with Document       |
| - PYQs & Summaries       | - Text highlighter              | - Flashcards carousel      |
| - My Notes               | - Page navigation & zoom        | - Practice Quiz drawer     |
+--------------------------+---------------------------------+----------------------------+
```

---

## 2. Directory Structure

```text
src/features/subjects/
├── components/
│   ├── resource-tree/      # Left pane: Shared Notes (Day/Unit wise), PYQs, My Notes tree
│   ├── viewer/             # Center pane: Multi-tab PDF/Markdown viewer & editor
│   └── ai-companion/       # Right pane: Chat with AI, Flashcards, Document Quiz
├── services/               # Mock and Real service abstractions
│   ├── types.ts            # SubjectsService interface
│   ├── mockService.ts      # Mock notes tree, simulated AI chat, flashcards, & quiz
│   ├── realService.ts      # Supabase note queries + FastAPI /api/v1/subjects-ai/*
│   └── index.ts            # Auto-selected based on VITE_USE_MOCKS
├── store/                  # Local workspace state (active PDF tab, extracted text)
├── SubjectWorkspacePage.tsx
└── README.md
```

---

## 3. Mock-First Development Workflow

### Step 1: Build the 3-Pane UI using Mock Services
1. Ensure `VITE_USE_MOCKS=true` in `frontend/.env`.
2. Inspect or customize mock notes, flashcards, and AI responses in [`services/mockService.ts`](services/mockService.ts).
3. Import and use `subjectsService` in your components:
   ```typescript
   import { subjectsService } from "./services";

   // Fetch subject details and notes:
   const { data: subject } = await subjectsService.getSubject(subjectId);
   const { data: notes } = await subjectsService.getSubjectNotes(subjectId);

   // Right-pane AI companion actions:
   const { data: chatRes } = await subjectsService.chatWithDocument(noteId, message, activeText);
   const { data: flashcards } = await subjectsService.generateFlashcards(noteId, activeText);
   const { data: quizQuestions } = await subjectsService.generateQuiz(noteId, activeText);
   ```
4. Build and test the Left Pane (notes tree), Center Pane (document viewer), and Right Pane (AI companion) with immediate mock feedback.

### Step 2: Implement Real Queries & AI Endpoints
When the UI interactions are smooth:
1. Open [`services/realService.ts`](services/realService.ts).
2. The real service is configured to:
   - Query `subjects` and `notes` from Supabase with RLS filtering.
   - Post to FastAPI endpoints:
     - `POST /api/v1/subjects-ai/chat`
     - `POST /api/v1/subjects-ai/flashcards`
     - `POST /api/v1/subjects-ai/quiz`
3. Toggle `VITE_USE_MOCKS=false` in `.env` to connect with live Supabase and the FastAPI backend.
