# Feature Guide: Project Analysis (`features/project-analysis`)

**Scope:** Public GitHub repository architecture and hygiene audit tool.  
**Frontend Route:** `/project-analysis`  
**Backend Counterpart:** [`backend/features/project_analysis/`](../../../../backend/features/project_analysis/README.md)  
**Backend API:** `POST /api/v1/project-analysis/analyze`  
**Supabase Requirement:** **None (100% Stateless)**

---

## 1. Developer Ownership

- **Your Workspace:** `frontend/src/features/project-analysis/`
- **Main Component:** `ProjectAnalysisPage.tsx`
- **Service Layer:** `services/`
  - `services/types.ts` — `ProjectAnalysisService` interface.
  - `services/mockService.ts` — Realistic GitHub repository analysis results with simulated delay.
  - `services/realService.ts` — Production caller to FastAPI `POST /api/v1/project-analysis/analyze`.
  - `services/index.ts` — Automatic dispatcher governed by `VITE_USE_MOCKS`.

---

## 2. Mock-First Development Workflow

### Step 1: Build the UI using Mock Services
1. Ensure `VITE_USE_MOCKS=true` in `frontend/.env`.
2. Inspect or customize mock audit output in [`services/mockService.ts`](services/mockService.ts).
3. Import and use `projectAnalysisService` in `ProjectAnalysisPage.tsx`:
   ```typescript
   import { projectAnalysisService } from "./services";

   // Trigger repo analysis:
   const { data: audit, error } = await projectAnalysisService.analyzeRepository(githubUrl);
   ```
4. Build the repository input form, loading indicators, audit summary badges, strengths list, and recommendations accordion.

### Step 2: Connect to Live FastAPI Backend
When your audit presentation UI is complete:
1. Ensure the backend FastAPI server is running (`cd backend && uvicorn main:app --reload`).
2. Verify [`services/realService.ts`](services/realService.ts) which delegates to `apiPost("/api/v1/project-analysis/analyze", ...)`.
3. Set `VITE_USE_MOCKS=false` in `frontend/.env`. Your UI will now trigger real AI audits on live GitHub repositories.
