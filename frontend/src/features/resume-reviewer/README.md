# Feature Guide: Resume Reviewer (`features/resume-reviewer`)

**Scope:** PDF resume ATS scoring and placement feedback tool.  
**Frontend Route:** `/resume-reviewer`  
**Backend Counterpart:** [`backend/features/resume_reviewer/`](../../../../backend/features/resume_reviewer/README.md)  
**Backend API:** `POST /api/v1/resume-reviewer/review` (`multipart/form-data`)  
**Supabase Requirement:** **None (100% Stateless)**

---

## 1. Developer Ownership

- **Your Workspace:** `frontend/src/features/resume-reviewer/`
- **Main Component:** `ResumeReviewerPage.tsx`
- **Service Layer:** `services/`
  - `services/types.ts` — `ResumeReviewerService` interface.
  - `services/mockService.ts` — Mock ATS score, feedback list, and keyword suggestions with simulated upload latency.
  - `services/realService.ts` — Production caller via `apiPostForm` to FastAPI.
  - `services/index.ts` — Automatic dispatcher governed by `VITE_USE_MOCKS`.

---

## 2. Mock-First Development Workflow

### Step 1: Build the UI with Mock Services
1. Ensure `VITE_USE_MOCKS=true` in `frontend/.env`.
2. Inspect or customize mock review output in [`services/mockService.ts`](services/mockService.ts).
3. Import and use `resumeReviewerService` in `ResumeReviewerPage.tsx`:
   ```typescript
   import { resumeReviewerService } from "./services";

   // Submit resume for review:
   const { data: review, error } = await resumeReviewerService.reviewResume(selectedPdfFile, targetRole);
   ```
4. Build the drag-and-drop PDF dropzone, upload progress bar, radial ATS score meter, categorized feedback cards, and recommended keyword chips.

### Step 2: Connect to Live FastAPI Backend
When your UI and score displays are ready:
1. Ensure the FastAPI backend is running (`cd backend && uvicorn main:app --reload`).
2. Verify [`services/realService.ts`](services/realService.ts) which packages the PDF into a `FormData` payload and calls `apiPostForm("/api/v1/resume-reviewer/review", formData)`.
3. Set `VITE_USE_MOCKS=false` in `frontend/.env`. Your UI will now process real uploaded resumes through the Gemini ATS reviewer.
