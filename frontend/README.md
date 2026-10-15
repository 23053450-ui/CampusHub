# CampusHub Frontend

React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui frontend application for CampusHub.

---

## 1. Directory Structure

```text
frontend/src/
├── app/                        # Shell layout (RootLayout.tsx) & aggregated route definitions (routes.tsx)
│   ├── layouts/RootLayout.tsx
│   └── routes.tsx
├── components/
│   └── ui/                     # shadcn/ui primitives
├── lib/                        # Core singletons: supabase.ts, api-client.ts, utils.ts
├── shared/                     # Global result and user types
│   ├── result.ts
│   └── user.ts
│
└── features/                   # 🎯 1 Folder = 1 Developer Ownership
    ├── dashboard/              # Dashboard overview (components/, services/, routes.tsx, DashboardPage.tsx)
    ├── communities/            # Forum & resource archive (components/, services/, routes.tsx, CommunitiesPage.tsx)
    ├── subject-viewer/         # Notes tree & document/PDF viewer (components/, services/, routes.tsx, SubjectViewerPage.tsx)
    ├── subject-ai-panel/       # AI companion panel (components/, services/, routes.tsx, SubjectAiPanelPage.tsx)
    ├── project-analysis/       # GitHub repo audit tool (components/, services/, routes.tsx, ProjectAnalysisPage.tsx)
    ├── resume-reviewer/        # ATS PDF resume reviewer (components/, services/, routes.tsx, ResumeReviewerPage.tsx)
    └── daily-quiz/             # CS fundamentals practice quiz (components/, services/, routes.tsx, DailyQuizPage.tsx)
```

---

## 2. Developer Feature Ownership Matrix

Every developer is assigned **one isolated feature folder**:

| Feature Directory | Primary Route | Data & API Flow | Backend Reference |
| :--- | :--- | :--- | :--- |
| **[`features/dashboard/`](src/features/dashboard/README.md)** | `/` | Direct **Supabase** (`profiles`, `subjects`, `enrollments`) | *None* |
| **[`features/communities/`](src/features/communities/README.md)** | `/communities` | Direct **Supabase** (`posts`, `comments`, `notes`, `vote_post` RPC) | *None* |
| **[`features/subject-viewer/`](src/features/subject-viewer/README.md)** | `/subjects/:subjectId` | Direct **Supabase** (`subjects`, `notes`, `subject-notes` bucket) | *None* |
| **[`features/subject-ai-panel/`](src/features/subject-ai-panel/README.md)** | `/subjects-ai/:subjectId` | **FastAPI** (`/api/v1/subjects-ai/*`) | [`backend/features/subjects_ai/`](../../backend/features/subjects_ai/README.md) |
| **[`features/project-analysis/`](src/features/project-analysis/README.md)** | `/project-analysis` | Stateless via **FastAPI** `POST /api/v1/project-analysis/analyze` | [`backend/features/project_analysis/`](../../backend/features/project_analysis/README.md) |
| **[`features/resume-reviewer/`](src/features/resume-reviewer/README.md)** | `/resume-reviewer` | Stateless via **FastAPI** `POST /api/v1/resume-reviewer/review` | [`backend/features/resume_reviewer/`](../../backend/features/resume_reviewer/README.md) |
| **[`features/daily-quiz/`](src/features/daily-quiz/README.md)** | `/daily-quiz` | **FastAPI** `/api/v1/daily-quiz/*` + Supabase `user_streaks` | [`backend/features/daily_quiz/`](../../backend/features/daily_quiz/README.md) |

---

## 3. Service Architecture & Mock-First Workflow

Every feature under `src/features/<feature-name>/` follows a standardized service pattern in `services/`:

```text
src/features/<feature-name>/
├── services/
│   ├── types.ts          # Strongly-typed interface (e.g. DashboardService)
│   ├── mockService.ts    # Realistic mock data with simulated network latency
│   ├── realService.ts    # Live queries via Supabase client or FastAPI api-client
│   └── index.ts          # Auto-exports mock or real service based on VITE_USE_MOCKS
├── components/           # Sub-components isolated to this feature
├── <Feature>Page.tsx     # Main page view
├── routes.tsx            # Route definition exported to app/routes.tsx
└── README.md             # Feature-specific developer guide
```

### 3-Step Development Process:
1. **Develop UI with Mocks (`VITE_USE_MOCKS=true`)**: Build components and test all UI states (loading, empty, success, error) using `mockService.ts`.
2. **Implement Real Backend/Supabase Service (`realService.ts`)**: Implement the same methods using `@/lib/supabase` or `@/lib/api-client`.
3. **Connect Live (`VITE_USE_MOCKS=false`)**: Switch the environment flag to verify real end-to-end integration without touching UI component code.

---

## 4. Local Development

```bash
cd frontend
pnpm install
pnpm dev
```
Open [http://localhost:5173](http://localhost:5173).

To build the production bundle:
```bash
pnpm build
```

To run typecheck:
```bash
pnpm tsc --noEmit
```
