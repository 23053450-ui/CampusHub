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
└── features/                   # 1 Folder = 1 Developer Ownership
    ├── dashboard/              # Dashboard feature (components/, services/, routes.tsx, DashboardPage.tsx)
    ├── communities/            # Communities feature (components/, services/, routes.tsx, CommunitiesPage.tsx)
    ├── subjects/               # Subjects workspace (components/, services/, routes.tsx, SubjectWorkspacePage.tsx)
    ├── project-analysis/       # Project Analysis feature (components/, services/, routes.tsx, ProjectAnalysisPage.tsx)
    ├── resume-reviewer/        # Resume Reviewer feature (components/, services/, routes.tsx, ResumeReviewerPage.tsx)
    └── daily-quiz/             # Daily Quiz feature (components/, services/, routes.tsx, DailyQuizPage.tsx)
```

---

## 2. Developer Feature Ownership

| Feature Directory | Primary Route | Data & API Flow |
| :--- | :--- | :--- |
| **`features/dashboard/`** | `/` | Direct **Supabase** |
| **`features/communities/`** | `/communities` | Direct **Supabase** |
| **`features/subjects/`** | `/subjects/:subjectId` | **Supabase** & **FastAPI** |
| **`features/project-analysis/`** | `/project-analysis` | **FastAPI** |
| **`features/resume-reviewer/`** | `/resume-reviewer` | **FastAPI** |
| **`features/daily-quiz/`** | `/daily-quiz` | **FastAPI** & **Supabase** |

---

## 3. Local Development

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

To run lint checks:
```bash
pnpm lint
```
