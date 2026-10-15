# Feature Guide: Subject AI Study Companion Panel (`features/subject-ai-panel`)

The **Subject AI Panel** feature provides an intelligent, document-grounded AI companion for university study courses. It extracts text context from active course notes to deliver conversational question answering, automated flashcard generation, and active-recall comprehension quizzes.

- **Frontend Path:** `frontend/src/features/subject-ai-panel/`
- **Backend Counterpart:** [`backend/features/subjects_ai/`](../../../../backend/features/subjects_ai/README.md)
- **Primary Route:** Embedded as the **Right Sidebar** of `/subjects/:subjectId` (via `app/layouts/SubjectWorkspaceLayout.tsx`)
- **Backend Services:** FastAPI (`/api/v1/subjects-ai/*`)

> [!IMPORTANT]
> **Feature Isolation & Shell Integration:**
> `subject-ai-panel` is fully isolated in its own feature folder. It does not import from `subject-viewer` (and vice-versa). The app shell layout ([`SubjectWorkspaceLayout.tsx`](../../app/layouts/SubjectWorkspaceLayout.tsx)) imports `SubjectAiPanelPage` and renders it as the dedicated right-hand study panel alongside the document viewer. Use `useParams().subjectId` to access the current course ID.

---

## 1. Backend Integration Details

This feature is paired 1:1 with the FastAPI backend module at [`backend/features/subjects_ai/`](../../../../backend/features/subjects_ai/).

### FastAPI Endpoints (`/api/v1/subjects-ai`)
- **`POST /api/v1/subjects-ai/chat`**: Conversational Q&A grounded in document text.
  - **Payload:** `{ note_id: string, message: string, context: string }`
  - **Response:** `{ reply: string }`
- **`POST /api/v1/subjects-ai/flashcards`**: Generates study flashcards from note text.
  - **Payload:** `{ note_id: string, context: string }`
  - **Response:** `Array<{ question: string, answer: string }>`
- **`POST /api/v1/subjects-ai/quiz`**: Generates a 5-question comprehension quiz.
  - **Payload:** `{ note_id: string, context: string }`
  - **Response:** `Array<{ id: string, question: string, options: string[], correctAnswerIndex: number, explanation: string }>`

Refer to [`backend/features/subjects_ai/router.py`](../../../../backend/features/subjects_ai/router.py) and [`backend/features/subjects_ai/schemas.py`](../../../../backend/features/subjects_ai/schemas.py) for the server-side Pydantic models.

---

## 2. File & Directory Anatomy

```text
frontend/src/features/subject-ai-panel/
├── SubjectAiPanelPage.tsx    # Main container coordinating tabs: Chat, Flashcards, Quiz
├── routes.tsx                # Route definition (/subjects-ai and /subjects-ai/:subjectId)
├── components/               # Sub-components isolated to the AI companion panel
│   ├── AiChatDrawer.tsx      # Conversation thread, user/assistant chat bubbles, message input
│   ├── FlashcardCarousel.tsx # Flip-card review UI with Next/Prev and mastery buttons
│   ├── DocQuizModal.tsx      # Interactive 5-question test with timer and instant answer check
│   └── PromptInput.tsx       # Message input with quick action chips (e.g. "Summarize", "Explain simply")
├── services/                 # Data access layer
│   ├── types.ts              # SubjectAiPanelService interface & response contracts
│   ├── mockService.ts        # Mock implementation returning simulated AI outputs
│   ├── realService.ts        # FastAPI caller using apiPost from @/lib/api-client
│   └── index.ts              # Active service switcher controlled by VITE_USE_MOCKS
└── README.md                 # This developer guide
```

---

## 3. Service Architecture & Mock vs Real Workflow

All data operations must be declared in `services/types.ts` and implemented in both `mockService.ts` and `realService.ts`.

### Step 1: Define Service Types (`services/types.ts`)
```typescript
import type { Result } from "@/shared/result";

export interface Flashcard {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface SubjectAiPanelService {
  chatWithDocument(noteId: string, message: string, contextText: string): Promise<Result<{ reply: string }>>;
  generateFlashcards(noteId: string, contextText: string): Promise<Result<Flashcard[]>>;
  generateQuiz(noteId: string, contextText: string): Promise<Result<QuizQuestion[]>>;
}
```

### Step 2: Implement Mock Service (`services/mockService.ts`)
Return realistic simulated AI output with delay (500ms–800ms) to test loading skeletons and typing animations without incurring Gemini API costs:
```typescript
import type { Result } from "@/shared/result";
import type { SubjectAiPanelService, Flashcard, QuizQuestion } from "./types";

export const mockSubjectAiPanelService: SubjectAiPanelService = {
  async chatWithDocument(_noteId: string, message: string, _context: string): Promise<Result<{ reply: string }>> {
    await new Promise((r) => setTimeout(r, 600));
    return {
      data: { reply: `Here is a clear explanation regarding "${message}": Key concepts depend on minimal superkeys and lossless decompositions.` },
      error: null,
    };
  },
  async generateFlashcards(_noteId: string, _context: string): Promise<Result<Flashcard[]>> {
    await new Promise((r) => setTimeout(r, 700));
    return {
      data: [
        { question: "What is 3NF?", answer: "A relation where for every X -> Y, X is a superkey or Y is prime." },
        { question: "What is BCNF?", answer: "A relation where for every non-trivial X -> Y, X strictly must be a superkey." },
      ],
      error: null,
    };
  },
  async generateQuiz(_noteId: string, _context: string): Promise<Result<QuizQuestion[]>> {
    await new Promise((r) => setTimeout(r, 700));
    return {
      data: [
        {
          id: "q1",
          question: "Which normal form guarantees dependency preservation?",
          options: ["1NF", "2NF", "3NF", "BCNF"],
          correctAnswerIndex: 2,
          explanation: "3NF always preserves dependencies; BCNF decompositions may lose them.",
        },
      ],
      error: null,
    };
  },
};
```

### Step 3: Implement Real Service (`services/realService.ts`)
Connect directly to the FastAPI backend using `apiPost`:
```typescript
import { apiPost } from "@/lib/api-client";
import type { Result } from "@/shared/result";
import type { SubjectAiPanelService, Flashcard, QuizQuestion } from "./types";

export const realSubjectAiPanelService: SubjectAiPanelService = {
  async chatWithDocument(noteId: string, message: string, contextText: string): Promise<Result<{ reply: string }>> {
    return apiPost<{ reply: string }>("/api/v1/subjects-ai/chat", {
      note_id: noteId,
      message,
      context: contextText,
    });
  },
  async generateFlashcards(noteId: string, contextText: string): Promise<Result<Flashcard[]>> {
    return apiPost<Flashcard[]>("/api/v1/subjects-ai/flashcards", {
      note_id: noteId,
      context: contextText,
    });
  },
  async generateQuiz(noteId: string, contextText: string): Promise<Result<QuizQuestion[]>> {
    return apiPost<QuizQuestion[]>("/api/v1/subjects-ai/quiz", {
      note_id: noteId,
      context: contextText,
    });
  },
};
```

### Step 4: Dispatch in `services/index.ts`
```typescript
import { mockSubjectAiPanelService } from "./mockService";
import { realSubjectAiPanelService } from "./realService";
import type { SubjectAiPanelService } from "./types";

export * from "./types";

const isMock = import.meta.env.VITE_USE_MOCKS === "true";
export const subjectAiPanelService: SubjectAiPanelService = isMock
  ? mockSubjectAiPanelService
  : realSubjectAiPanelService;
```

---

## 4. How to Develop

1. **Keep `VITE_USE_MOCKS=true`** in `frontend/.env`.
2. Open `SubjectAiPanelPage.tsx`. Import `subjectAiPanelService` from `./services`.
3. Construct the 3 tab views:
   - **Chat Tab:** Scrollable message list with auto-scroll to bottom, input bar, and loading message bubble.
   - **Flashcards Tab:** Card flip component on click, next/previous buttons, and progress counter.
   - **Quiz Tab:** Question card, radio group for options, "Submit" button, and score modal.
4. Once the components render and animate smoothly with mock data, launch the FastAPI backend (`cd backend && uvicorn main:app --reload`), set `VITE_USE_MOCKS=false`, and test live generation with Gemini.

---

## 5. How to Test

- **Latency Handling:** Test that chat and quiz cards show a clear spinner or skeleton while waiting for AI generation.
- **Error States:** Ensure network errors (e.g. backend offline or rate limit 429) display a non-blocking toast or banner.
- **Type Checking:** Run from `frontend/`:
  ```bash
  pnpm tsc --noEmit
  ```
