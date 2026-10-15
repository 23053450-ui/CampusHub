# Feature Guide: GitHub Project Analysis (`features/project-analysis`)

The **Project Analysis** feature audits public GitHub repositories to evaluate architecture patterns, tech stack composition, security hygiene, and engineering strengths. It generates actionable recommendations to help students improve capstone and portfolio projects.

- **Frontend Path:** `frontend/src/features/project-analysis/`
- **Backend Counterpart:** [`backend/features/project_analysis/`](../../../../backend/features/project_analysis/README.md)
- **Primary Route:** `/project-analysis`
- **Backend Services:** FastAPI (`POST /api/v1/project-analysis/analyze`)
- **Supabase Requirement:** *None* (100% Stateless)

> [!IMPORTANT]
> **Feature Isolation Rule:**
> Nothing outside this folder may import from it, except `app/routes.tsx` which imports `projectAnalysisRoute`. Imports are only permitted from `components/ui`, `lib/`, `shared/`, and this feature's own directory.

---

## 1. Backend Integration Details

This feature communicates 1:1 with the FastAPI backend module at [`backend/features/project_analysis/`](../../../../backend/features/project_analysis/).

### FastAPI Endpoint (`POST /api/v1/project-analysis/analyze`)
- **Request Body:**
  ```json
  {
    "github_url": "https://github.com/facebook/react"
  }
  ```
- **Response Shape:**
  ```json
  {
    "repository_name": "facebook/react",
    "tech_stack": ["JavaScript", "TypeScript", "Babel", "Rollup", "Jest"],
    "architecture_summary": "Monorepo containing React core packages and DOM reconciler.",
    "strengths": [
      "Rigorous unit test coverage across synthetic events",
      "Strict monorepo package boundary enforcement"
    ],
    "critical_issues": [
      "Complex custom build toolchain requires specialized configuration"
    ],
    "recommendations": [
      "Adopt modern ESM standard modules across internal tooling"
    ]
  }
  ```

Refer to [`backend/features/project_analysis/router.py`](../../../../backend/features/project_analysis/router.py) and [`backend/features/project_analysis/schemas.py`](../../../../backend/features/project_analysis/schemas.py).

---

## 2. File & Directory Anatomy

```text
frontend/src/features/project-analysis/
├── ProjectAnalysisPage.tsx   # Main page coordinating repository input form and results audit
├── routes.tsx                # Route definition (/project-analysis)
├── components/               # Sub-components isolated to project analysis
│   ├── RepoInputForm.tsx     # URL input field, sample repo chips, and "Analyze" submit button
│   ├── AuditSummaryCard.tsx  # Overview card: repository name, tech stack badges, and architecture summary
│   ├── StrengthsList.tsx     # Bulleted cards highlighting engineering strengths
│   ├── CriticalIssuesList.tsx# Warning cards highlighting architectural vulnerabilities
│   └── RecommendationsAccordion.tsx # Collapsible recommendations for students
├── services/                 # Data access layer
│   ├── types.ts              # ProjectAnalysisService interface & data contracts
│   ├── mockService.ts        # Mock implementation returning simulated repository audit
│   ├── realService.ts        # Production caller via apiPost to FastAPI backend
│   └── index.ts              # Active service switcher governed by VITE_USE_MOCKS
└── README.md                 # This developer guide
```

---

## 3. Service Architecture & Mock vs Real Workflow

All data operations must be declared in `services/types.ts` and implemented in both `mockService.ts` and `realService.ts`.

### Step 1: Define Service Types (`services/types.ts`)
```typescript
import type { Result } from "@/shared/result";

export interface ProjectAnalysisResult {
  repositoryName: string;
  techStack: string[];
  architectureSummary: string;
  strengths: string[];
  criticalIssues: string[];
  recommendations: string[];
}

export interface ProjectAnalysisService {
  analyzeRepository(githubUrl: string): Promise<Result<ProjectAnalysisResult>>;
}
```

### Step 2: Implement Mock Service (`services/mockService.ts`)
Return realistic simulated audit results with simulated processing delay (800ms) to test loading skeletons and animation effects without needing a live backend:
```typescript
import type { Result } from "@/shared/result";
import type { ProjectAnalysisService, ProjectAnalysisResult } from "./types";

export const mockProjectAnalysisService: ProjectAnalysisService = {
  async analyzeRepository(githubUrl: string): Promise<Result<ProjectAnalysisResult>> {
    await new Promise((r) => setTimeout(r, 800));
    return {
      data: {
        repositoryName: githubUrl.split("/").slice(-2).join("/") || "sample/repo",
        techStack: ["React 19", "TypeScript", "FastAPI", "Tailwind CSS"],
        architectureSummary: "Clean decoupled frontend/backend structure with strict feature isolation.",
        strengths: ["Strict TypeScript compilation", "Modular service abstraction layer"],
        criticalIssues: ["Missing rate limiting on public analysis endpoints"],
        recommendations: ["Add automated end-to-end smoke testing before release"],
      },
      error: null,
    };
  },
};
```

### Step 3: Implement Real Service (`services/realService.ts`)
Call the FastAPI backend endpoint via `apiPost`:
```typescript
import { apiPost } from "@/lib/api-client";
import type { Result } from "@/shared/result";
import type { ProjectAnalysisService, ProjectAnalysisResult } from "./types";

export const realProjectAnalysisService: ProjectAnalysisService = {
  async analyzeRepository(githubUrl: string): Promise<Result<ProjectAnalysisResult>> {
    return apiPost<ProjectAnalysisResult>("/api/v1/project-analysis/analyze", {
      github_url: githubUrl,
    });
  },
};
```

### Step 4: Dispatch in `services/index.ts`
```typescript
import { mockProjectAnalysisService } from "./mockService";
import { realProjectAnalysisService } from "./realService";
import type { ProjectAnalysisService } from "./types";

export * from "./types";

const isMock = import.meta.env.VITE_USE_MOCKS === "true";
export const projectAnalysisService: ProjectAnalysisService = isMock
  ? mockProjectAnalysisService
  : realProjectAnalysisService;
```

---

## 4. How to Develop

1. **Keep `VITE_USE_MOCKS=true`** in `frontend/.env`.
2. Open `ProjectAnalysisPage.tsx`. Import `projectAnalysisService` from `./services`.
3. Build `RepoInputForm` with URL validation (must be a valid GitHub repo URL).
4. Implement the audit dashboard with `AuditSummaryCard`, `StrengthsList`, and `RecommendationsAccordion`.
5. Start the backend (`cd backend && uvicorn main:app --reload`), set `VITE_USE_MOCKS=false` in `frontend/.env`, and test live analysis on real repositories.

---

## 5. How to Test

- **Invalid URLs:** Verify that submitting a non-GitHub URL shows a validation error message.
- **Loading State:** Ensure the form displays a spinner/progress bar while the AI inspection runs.
- **Type Checking:** Run from `frontend/`:
  ```bash
  pnpm tsc --noEmit
  ```
