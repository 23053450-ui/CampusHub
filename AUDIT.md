# CampusHub Repo Skeleton Audit & Isolation Report

## Phase 1: Audit of Violations

This audit lists all files in `frontend/`, `backend/`, `supabase/`, and all READMEs that violate the repo skeleton isolation rules (containing feature logic, mock data, endpoints, queries, data models, cross-feature imports, or detailed non-skeleton documentation).

### A. Frontend Feature Internals (`frontend/src/features/*`)
- `frontend/src/features/communities/services/mockService.ts`: Contains mock posts/comments data and implementation logic instead of header comment only.
- `frontend/src/features/communities/services/realService.ts`: Contains Supabase queries, RPC calls, storage uploads, and error handling instead of header comment only.
- `frontend/src/features/communities/services/types.ts`: Contains domain service interfaces and input types instead of header comment only.
- `frontend/src/features/communities/services/index.ts`: Contains runtime service dispatcher and environment variable branching instead of header comment only.
- `frontend/src/features/communities/CommunitiesPage.tsx`: Missing placeholder heading (renders empty `div` instead of `<h1>Communities</h1>`).
- `frontend/src/features/communities/components/`: Directory missing from standard feature skeleton folder layout.
- `frontend/src/features/daily-quiz/services/mockService.ts`: Contains mock questions and grading logic instead of header comment only.
- `frontend/src/features/daily-quiz/services/realService.ts`: Contains real API client network calls and error mapping instead of header comment only.
- `frontend/src/features/daily-quiz/services/types.ts`: Contains domain service interfaces and submission types instead of header comment only.
- `frontend/src/features/daily-quiz/services/index.ts`: Contains service dispatcher logic instead of header comment only.
- `frontend/src/features/daily-quiz/DailyQuizPage.tsx`: Missing placeholder heading (renders empty `div` instead of `<h1>Daily Quiz</h1>`).
- `frontend/src/features/daily-quiz/components/`: Directory missing from standard feature skeleton folder layout.
- `frontend/src/features/dashboard/services/mockService.ts`: Contains mock user profile and enrolled subjects data instead of header comment only.
- `frontend/src/features/dashboard/services/realService.ts`: Contains Supabase database queries instead of header comment only.
- `frontend/src/features/dashboard/services/types.ts`: Contains domain service interfaces instead of header comment only.
- `frontend/src/features/dashboard/services/index.ts`: Contains service dispatcher logic instead of header comment only.
- `frontend/src/features/dashboard/DashboardPage.tsx`: Missing placeholder heading (renders empty `div` instead of `<h1>Dashboard</h1>`).
- `frontend/src/features/dashboard/index.ts`: Redundant barrel file outside standard skeleton layout.
- `frontend/src/features/dashboard/components/`: Directory missing from standard feature skeleton folder layout.
- `frontend/src/features/project-analysis/services/mockService.ts`: Contains mock repository analysis payload instead of header comment only.
- `frontend/src/features/project-analysis/services/realService.ts`: Contains backend API client calls instead of header comment only.
- `frontend/src/features/project-analysis/services/types.ts`: Contains domain service interfaces and request types instead of header comment only.
- `frontend/src/features/project-analysis/services/index.ts`: Contains service dispatcher logic instead of header comment only.
- `frontend/src/features/project-analysis/ProjectAnalysisPage.tsx`: Missing placeholder heading (renders empty `div` instead of `<h1>Project Analysis</h1>`).
- `frontend/src/features/project-analysis/components/`: Directory missing from standard feature skeleton folder layout.
- `frontend/src/features/resume-reviewer/services/mockService.ts`: Contains mock ATS review results and keyword arrays instead of header comment only.
- `frontend/src/features/resume-reviewer/services/realService.ts`: Contains FormData packaging and multipart API calls instead of header comment only.
- `frontend/src/features/resume-reviewer/services/types.ts`: Contains domain service interfaces instead of header comment only.
- `frontend/src/features/resume-reviewer/services/index.ts`: Contains service dispatcher logic instead of header comment only.
- `frontend/src/features/resume-reviewer/ResumeReviewerPage.tsx`: Missing placeholder heading (renders empty `div` instead of `<h1>Resume Reviewer</h1>`).
- `frontend/src/features/resume-reviewer/components/`: Directory missing from standard feature skeleton folder layout.
- `frontend/src/features/subjects/services/mockService.ts`: Contains mock notes, flashcards, quiz questions, and AI chat data instead of header comment only.
- `frontend/src/features/subjects/services/realService.ts`: Contains Supabase queries and backend AI companion API calls instead of header comment only.
- `frontend/src/features/subjects/services/types.ts`: Contains domain service interfaces instead of header comment only.
- `frontend/src/features/subjects/services/index.ts`: Contains service dispatcher logic instead of header comment only.
- `frontend/src/features/subjects/SubjectWorkspacePage.tsx`: Missing placeholder heading (renders empty `div` instead of `<h1>Subject Workspace</h1>`).
- `frontend/src/features/subjects/components/ai-companion/README.md`: Non-standard nested component documentation specifying API endpoints.

### B. Global Types & Contracts (`frontend/src/types/`)
- `frontend/src/types/index.ts`: Exists as a centralized types directory containing feature data models (`Post`, `Comment`, `Note`, `Flashcard`, `QuizQuestion`, `ResumeReviewResult`, `ProjectAnalysisResult`) which must be removed.
- `frontend/src/types/index.ts`: Header comment contains forbidden terminology ("Domain Types & Contracts").
- `frontend/src/types/index.ts`: Defines `Subject` with extra non-minimal properties (`userCount`, `isEnrolled`) instead of minimal `id, name, code`.
- `frontend/src/types/`: Centralized folder must be deleted and replaced with `frontend/src/shared/` containing only `result.ts` and `user.ts`.
- `frontend/src/lib/api-client.ts`: Imports from `@/types` instead of `@/shared/result`.

### C. Routing and App Shell (`frontend/src/app/`)
- `frontend/src/app/routes.tsx`: Centrally constructs all feature routes and lazy loads page components directly, instead of importing individual route objects exported by each feature.
- `frontend/src/app/layouts/RootLayout.tsx`: Hardcodes feature data and links (`const subjects = [...]`, hardcoded "My Subjects" navigation, hardcoded "Student Tools" feature routing) instead of a pure shell with sidebar, header, and outlet.

### D. Backend Features and Application Entry (`backend/features/*`, `backend/main.py`)
- `backend/features/daily_quiz/router.py`: Implements route endpoints (`@router.get("/today")`, `@router.post("/submit")`) and dependency injections instead of empty APIRouter.
- `backend/features/daily_quiz/schemas.py`: Implements Pydantic models (`DailyQuizQuestion`, `DailyQuizSubmission`, `DailyQuizResult`) instead of header comment only.
- `backend/features/daily_quiz/service.py`: Implements mock question retrieval and streak evaluation logic instead of header comment only.
- `backend/features/project_analysis/router.py`: Implements route endpoint (`@router.post("/analyze")`) instead of empty APIRouter.
- `backend/features/project_analysis/schemas.py`: Implements Pydantic models (`ProjectAnalysisRequest`, `ProjectAnalysisResponse`) instead of header comment only.
- `backend/features/project_analysis/service.py`: Implements Google GenAI client initialization and prompt execution logic instead of header comment only.
- `backend/features/resume_reviewer/router.py`: Implements route endpoint (`@router.post("/review")`) instead of empty APIRouter.
- `backend/features/resume_reviewer/schemas.py`: Implements Pydantic model (`ResumeReviewResponse`) instead of header comment only.
- `backend/features/resume_reviewer/service.py`: Implements Google GenAI prompt evaluation and ATS parsing logic instead of header comment only.
- `backend/features/subjects_ai/router.py`: Implements route endpoints (`/chat`, `/flashcards`, `/quiz`) instead of empty APIRouter.
- `backend/features/subjects_ai/schemas.py`: Implements Pydantic models (`AIChatRequest`, `FlashcardsResponse`, `QuizResponse`, etc.) instead of header comment only.
- `backend/features/subjects_ai/service.py`: Implements Google GenAI LLM execution and flashcard/quiz generation logic instead of header comment only.
- `backend/main.py`: Inlines `HealthResponse` schema and `/api/v1/health` endpoint directly instead of isolating it inside `backend/shared/`.
- `backend/shared/`: Directory missing; does not exist to house the health check endpoint.

### E. Supabase Migrations & Shared Persistence (`supabase/`)
- `supabase/migrations/001_schema.sql`: Monolithic schema file grouping multiple feature tables together instead of 1 file per feature plus 1 core file.
- `supabase/migrations/002_rls.sql`: Monolithic RLS file grouping all security policies and procedures together instead of feature-isolated files.
- `supabase/migrations/003_storage.sql`: Monolithic storage configuration file defining buckets for multiple features together.
- `supabase/schema.sql`: Redundant consolidated schema file containing feature tables in root of `supabase/`.

### F. README Documentation
- `frontend/src/features/communities/README.md`: Contains endpoint descriptions, service workflow guides, and sample code snippets.
- `frontend/src/features/daily-quiz/README.md`: Contains API details, step-by-step workflow, and code snippets.
- `frontend/src/features/dashboard/README.md`: Contains query explanations and sample implementation code.
- `frontend/src/features/project-analysis/README.md`: Contains schema definitions, sample payloads, and code snippets.
- `frontend/src/features/resume-reviewer/README.md`: Contains API contract details, file upload handling, and code samples.
- `frontend/src/features/subjects/README.md`: Contains pane diagrams, API lists, and sample code.
- `backend/features/daily_quiz/README.md`: Contains endpoint lists and schema descriptions.
- `backend/features/project_analysis/README.md`: Contains endpoint lists, request/response JSON contracts, and Gemini prompts.
- `backend/features/resume_reviewer/README.md`: Contains endpoint lists and ATS score schemas.
- `backend/features/subjects_ai/README.md`: Contains endpoint lists and AI model prompt instructions.
- `README.md` (root): References deleted `frontend/src/types/` directory and contains endpoint listings.
- `frontend/README.md`: Contains mock-first development tutorials, code samples, and references `types/`.
- `backend/README.md`: Lists specific feature endpoints and models.

### G. Enforcement & Linting
- `frontend/`: Lacks ESLint `no-restricted-imports` rule forbidding cross-feature imports between `features/X` and `features/Y`, and restricting feature imports to `components/ui`, `lib/`, `shared/`, and their own directory.

---

## Shared Database Objects Requiring Unresolved Architectural Review

Per Phase 2.E instructions, the following database tables and storage buckets are shared across multiple features and are listed here without resolution:

1. **`notes` Table**:
   - Used by **`features/communities`** as an Academic Resources Archive (sharing past-year questions, lecture notes, and summaries).
   - Used by **`features/subjects`** as the notes tree in the 3-Pane study workspace and as the source text for the AI companion.
   - Status: Unresolved cross-feature ownership.

2. **`subject-notes` Storage Bucket**:
   - Used by **`features/communities`** for resource uploads (PDF notes up to 5 MiB).
   - Used by **`features/subjects`** for PDF document viewing and AI context extraction.
   - Status: Unresolved cross-feature ownership.

---

## Verification

The following verification steps were executed to validate that all Phase 2 isolation and skeleton constraints pass:

### 1. Frontend Build & Lint

#### `pnpm build` in `frontend/`:
```bash
$ tsc -b && vite build
vite v8.3.4 building client environment for production...
transforming...
✓ 1939 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.45 kB │ gzip:   0.29 kB
dist/assets/index-CJSW9hlN.css   38.17 kB │ gzip:   7.16 kB
dist/assets/index-BvR6R2Cq.js   326.78 kB │ gzip: 103.54 kB
✓ built in 546ms
```
**Result:** PASSED (Exit Code: 0).

#### `pnpm lint` in `frontend/`:
```bash
$ oxlint
Found 2 warnings and 0 errors.
Finished in 19ms on 64 files with 117 rules using 12 threads.
```
**Result:** PASSED (Exit Code: 0).

---

### 2. Backend Server & Health Check

#### `uvicorn main:app` startup & `GET /api/v1/health`:
```powershell
$proc = Start-Process -FilePath ".venv\Scripts\uvicorn.exe" -ArgumentList "main:app", "--port", "8000" -PassThru
Start-Sleep -Seconds 3
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health" | ConvertTo-Json -Compress
```
**Output:**
```json
{"status":"ok","version":"0.1.0"}
```
**Result:** PASSED (HTTP 200 OK).

---

### 3. Frontend Feature Internals Grep

Check that `frontend/src/features` contains zero feature logic, queries, or API calls:
```powershell
Get-ChildItem -Recurse frontend/src/features -File | Select-String -Pattern "supabase\.from", "supabase\.rpc", "supabase\.storage", "fetch\(", "apiClient\."
```
**Output:**
*(empty - no matches)*

**Result:** PASSED (Returned nothing).

---

### 4. Backend Feature Internals Grep

Check that `backend/features` contains zero endpoints, models, or AI client logic:
```powershell
Get-ChildItem -Recurse backend/features -File | Where-Object { $_.FullName -notmatch '\\(__pycache__)\\' } | Select-String -Pattern "genai", "@router\.get", "@router\.post", "BaseModel", "def "
```
**Output:**
*(empty - no matches)*

**Result:** PASSED (Returned nothing).

---

### 5. Cross-Feature Import Grep

Check that no feature imports from any other feature (`features/X` importing `features/Y`):
```powershell
Get-ChildItem -Recurse frontend/src/features -Include *.ts, *.tsx | Select-String -Pattern "import.*from.*features/"
Get-ChildItem -Recurse backend/features -Include *.py | Select-String -Pattern "features\."
```
**Output:**
*(empty - no matches)*

**Result:** PASSED (Returned nothing).

---

### 6. Elimination of Global `types/` Directory

Verify that `frontend/src/types/` no longer exists:
```powershell
Test-Path frontend/src/types
```
**Output:**
```
False
```
**Result:** PASSED (`frontend/src/types/` successfully deleted; types migrated to isolated `frontend/src/shared/`).
