# Feature Guide: ATS Resume Reviewer (`features/resume-reviewer`)

The **Resume Reviewer** feature gives students automated feedback and ATS (Applicant Tracking System) scoring on their technical resumes. Students upload a PDF resume (optionally targeting a specific job role) and receive an ATS match score, parsed keyword gap analysis, and placement-focused improvement suggestions.

- **Frontend Path:** `frontend/src/features/resume-reviewer/`
- **Backend Counterpart:** [`backend/features/resume_reviewer/`](../../../../backend/features/resume_reviewer/README.md)
- **Primary Route:** `/resume-reviewer`
- **Backend Services:** FastAPI (`POST /api/v1/resume-reviewer/review` via `multipart/form-data`)
- **Supabase Requirement:** *None* (100% Stateless)

> [!IMPORTANT]
> **Feature Isolation Rule:**
> Nothing outside this folder may import from it, except `app/routes.tsx` which imports `resumeReviewerRoute`. Imports are only permitted from `components/ui`, `lib/`, `shared/`, and this feature's own directory.

---

## 1. Backend Integration Details

This feature communicates 1:1 with the FastAPI backend module at [`backend/features/resume_reviewer/`](../../../../backend/features/resume_reviewer/).

### FastAPI Endpoint (`POST /api/v1/resume-reviewer/review`)
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `file`: The PDF resume file (max 5 MiB).
  - `target_role` *(optional)*: Target job title (e.g. "Full Stack Engineer", "Data Scientist").
- **Response Shape:**
  ```json
  {
    "score": 84,
    "summary": "Strong project portfolio with measurable outcomes. Formatting passes standard ATS parsing.",
    "strengths": [
      "Quantified impact in internship bullet points",
      "Clear categorization of technical competencies"
    ],
    "improvements": [
      "Add more cloud/deployment keywords corresponding to the target role",
      "Shorten summary section to 3 lines maximum"
    ],
    "suggested_keywords": [
      "PostgreSQL", "Docker", "REST APIs", "CI/CD"
    ]
  }
  ```

Refer to [`backend/features/resume_reviewer/router.py`](../../../../backend/features/resume_reviewer/router.py) and [`backend/features/resume_reviewer/schemas.py`](../../../../backend/features/resume_reviewer/schemas.py).

---

## 2. File & Directory Anatomy

```text
frontend/src/features/resume-reviewer/
├── ResumeReviewerPage.tsx    # Main page coordinator (renders upload zone and ATS score dashboard)
├── routes.tsx                # Route definition (/resume-reviewer)
├── components/               # Sub-components isolated to resume reviewer
│   ├── ResumeDropzone.tsx    # Drag-and-drop file upload component with PDF format validation
│   ├── AtsScoreMeter.tsx     # Circular radial gauge displaying the 0-100 ATS score
│   ├── FeedbackList.tsx      # Categorized strengths vs improvements card lists
│   └── KeywordChips.tsx      # Badges for identified and recommended keywords
├── services/                 # Data access layer
│   ├── types.ts              # ResumeReviewerService interface & data contracts
│   ├── mockService.ts        # Mock implementation returning simulated ATS scoring
│   ├── realService.ts        # Production caller via apiPostForm to FastAPI backend
│   └── index.ts              # Active service switcher governed by VITE_USE_MOCKS
└── README.md                 # This developer guide
```

---

## 3. Service Architecture & Mock vs Real Workflow

All data operations must be declared in `services/types.ts` and implemented in both `mockService.ts` and `realService.ts`.

### Step 1: Define Service Types (`services/types.ts`)
```typescript
import type { Result } from "@/shared/result";

export interface ResumeReviewResult {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestedKeywords: string[];
}

export interface ResumeReviewerService {
  reviewResume(file: File, targetRole?: string): Promise<Result<ResumeReviewResult>>;
}
```

### Step 2: Implement Mock Service (`services/mockService.ts`)
Simulate PDF review with 850ms latency to test file upload progress bars and radial score meter animations without backend dependency:
```typescript
import type { Result } from "@/shared/result";
import type { ResumeReviewerService, ResumeReviewResult } from "./types";

export const mockResumeReviewerService: ResumeReviewerService = {
  async reviewResume(_file: File, _targetRole?: string): Promise<Result<ResumeReviewResult>> {
    await new Promise((r) => setTimeout(r, 850));
    return {
      data: {
        score: 82,
        summary: "Solid project descriptions with measurable outcomes. Clean single-column layout.",
        strengths: ["Quantified achievements in internship experience", "Clearly categorized skills section"],
        improvements: ["Add more cloud deployment keywords", "Use stronger active action verbs"],
        suggestedKeywords: ["Docker", "CI/CD", "PostgreSQL", "RESTful APIs"],
      },
      error: null,
    };
  },
};
```

### Step 3: Implement Real Service (`services/realService.ts`)
Package the PDF into a `FormData` payload and dispatch using `apiPostForm`:
```typescript
import { apiPostForm } from "@/lib/api-client";
import type { Result } from "@/shared/result";
import type { ResumeReviewerService, ResumeReviewResult } from "./types";

export const realResumeReviewerService: ResumeReviewerService = {
  async reviewResume(file: File, targetRole?: string): Promise<Result<ResumeReviewResult>> {
    const formData = new FormData();
    formData.append("file", file);
    if (targetRole) formData.append("target_role", targetRole);

    return apiPostForm<ResumeReviewResult>("/api/v1/resume-reviewer/review", formData);
  },
};
```

### Step 4: Dispatch in `services/index.ts`
```typescript
import { mockResumeReviewerService } from "./mockService";
import { realResumeReviewerService } from "./realService";
import type { ResumeReviewerService } from "./types";

export * from "./types";

const isMock = import.meta.env.VITE_USE_MOCKS === "true";
export const resumeReviewerService: ResumeReviewerService = isMock
  ? mockResumeReviewerService
  : realResumeReviewerService;
```

---

## 4. How to Develop

1. **Keep `VITE_USE_MOCKS=true`** in `frontend/.env`.
2. Open `ResumeReviewerPage.tsx`. Import `resumeReviewerService` from `./services`.
3. Construct `ResumeDropzone` with drag-and-drop support, limiting file types to `.pdf` and size to 5MB.
4. Build `AtsScoreMeter` with animated score countup and color-coded score bands (e.g., green for 80+, amber for 60-79, red for <60).
5. Start the backend (`cd backend && uvicorn main:app --reload`), set `VITE_USE_MOCKS=false`, and test with real PDF resumes.

---

## 5. How to Test

- **File Type & Size:** Verify that non-PDF files or files >5MB trigger clear client-side validation errors before calling the service.
- **Loading State:** Ensure an upload progress bar or spinner displays while the AI evaluation executes.
- **Type Checking:** Run from `frontend/`:
  ```bash
  pnpm tsc --noEmit
  ```
