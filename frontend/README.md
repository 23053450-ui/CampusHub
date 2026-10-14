# CampusHub Frontend

React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui frontend application for CampusHub.

---

## 1. Directory Structure

```text
frontend/src/
├── app/                        # Routing (routes.tsx), RootLayout (Sidebar + Header)
│   ├── layouts/RootLayout.tsx
│   └── routes.tsx
├── components/
│   ├── ui/                     # shadcn/ui primitives (Button, Dialog, Tabs, etc.)
│   └── layout/                 # Layout helpers
├── lib/                        # Core singletons: supabase.ts, api-client.ts, utils.ts
├── types/                      # Global TypeScript interfaces & contracts
│
└── features/                   # 🎯 1 Folder = 1 Developer / Sub-team Ownership
    ├── dashboard/              # [Supabase Only] Dashboard overview
    ├── communities/            # [Supabase Only] Forum discussions & notes archive
    ├── subjects/               # [Supabase + FastAPI] 3-Pane Subject Workspace
    │   └── components/ai-companion/  # Right-pane Document AI companion
    ├── project-analysis/       # [FastAPI Only - Stateless] GitHub repo audit UI
    ├── resume-reviewer/        # [FastAPI Only - Stateless] PDF ATS review UI
    └── daily-quiz/             # [FastAPI + Supabase] Daily CS quiz & streaks UI
```

---

## 2. Developer Feature Ownership

| Feature Directory | Primary Route | Data & API Flow |
| :--- | :--- | :--- |
| **`features/dashboard/`** | `/` | Direct **Supabase** (enrolled subjects & profile) |
| **`features/communities/`** | `/communities` | Direct **Supabase** (`posts`, `comments`, `notes`, `vote_post` RPC) |
| **`features/subjects/`** | `/subjects/:subjectId` | Notes from **Supabase**; AI Companion calls **FastAPI** `/api/v1/subjects-ai/*` |
| **`features/project-analysis/`** | `/project-analysis` | Stateless via **FastAPI** `POST /api/v1/project-analysis/analyze` |
| **`features/resume-reviewer/`** | `/resume-reviewer` | Stateless via **FastAPI** `POST /api/v1/resume-reviewer/review` |
| **`features/daily-quiz/`** | `/daily-quiz` | **FastAPI** `/api/v1/daily-quiz/*` + Supabase quiz attempts |

---

## 3. Service Architecture & Mock-First Workflow

To ensure clean code and avoid merge chaos, every feature folder in `src/features/<feature-name>/` follows a standardized service pattern under `services/`:

```text
src/features/<feature-name>/
├── services/
│   ├── types.ts          # Strongly-typed interface (e.g. DashboardService)
│   ├── mockService.ts    # Realistic mock data with simulated network latency
│   ├── realService.ts    # Live queries via Supabase client or FastAPI api-client
│   └── index.ts          # Auto-exports mock or real service based on VITE_USE_MOCKS
├── components/           # Sub-components used by the feature
├── <Feature>Page.tsx     # Main page view
└── README.md             # Feature-specific API contract and dev guide
```

### 3-Step Development Process

1. **Step 1: Build UI with Mock Services (`VITE_USE_MOCKS=true`)**
   - Keep `VITE_USE_MOCKS=true` in `.env`.
   - Adjust dummy data and states in `services/mockService.ts` to match your UI needs.
   - Build your components and pages importing the service from `services`:
     ```typescript
     import { dashboardService } from "./services";
     const { data, error } = await dashboardService.getEnrolledSubjects();
     ```
2. **Step 2: Implement Real Services (`services/realService.ts`)**
   - Once your UI is tested and finalized, open `services/realService.ts`.
   - Implement each method using the Supabase client (`@/lib/supabase`) or backend API client (`@/lib/api-client`) as specified in your feature's README.
   - Keep the exact same method signatures as defined in `services/types.ts`.
3. **Step 3: Connect Live (`VITE_USE_MOCKS=false`)**
   - Set `VITE_USE_MOCKS=false` in `.env`.
   - Your components will automatically switch to `realService.ts` with zero code changes required in your UI components!

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

