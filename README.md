# CampusHub

CampusHub is a campus learning and collaboration platform that brings together student community discussions, academic resource archives, split-pane subject study workspaces with AI companions, and standalone technical tools.

---

## 1. System Architecture

The project is structured into three clean layers:

- **`frontend/`**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui.
  - **App Shell:** Collapsible sidebar and header with account avatar.
  - **Feature Modules:** Fully isolated feature folders with placeholder views.
- **`backend/`**: FastAPI service running in Python 3.11+.
  - **`core/`**: Server runtime (settings, CORS, auth, rate limiting).
  - **`features/`**: 1:1 matching feature modules (`subjects_ai`, `project_analysis`, `resume_reviewer`, `daily_quiz`).
  - **`shared/`**: System health check endpoint.
- **`supabase/`**: PostgreSQL database migrations split by feature plus shared core tables.

---

## 2. 1:1 Developer Ownership Matrix

Every developer is assigned one isolated feature folder in Frontend (+ 1 matching folder in Backend if it uses FastAPI) with zero overlapping files or cross-feature imports:

| Feature / Module | Frontend Path | Backend Path | Data & API Flow |
| :--- | :--- | :--- | :--- |
| **Dashboard** | [`src/features/dashboard/`](frontend/src/features/dashboard/README.md) | *None* | Direct **Supabase** |
| **Communities** | [`src/features/communities/`](frontend/src/features/communities/README.md) | *None* | Direct **Supabase** |
| **Subjects** | [`src/features/subjects/`](frontend/src/features/subjects/README.md) | [`backend/features/subjects_ai/`](backend/features/subjects_ai/README.md) | **Supabase** & **FastAPI** |
| **Project Analysis** | [`src/features/project-analysis/`](frontend/src/features/project-analysis/README.md) | [`backend/features/project_analysis/`](backend/features/project_analysis/README.md) | **FastAPI** |
| **Resume Reviewer** | [`src/features/resume-reviewer/`](frontend/src/features/resume-reviewer/README.md) | [`backend/features/resume_reviewer/`](backend/features/resume_reviewer/README.md) | **FastAPI** |
| **Daily Quiz** | [`src/features/daily-quiz/`](frontend/src/features/daily-quiz/README.md) | [`backend/features/daily_quiz/`](backend/features/daily_quiz/README.md) | **FastAPI** & **Supabase** |

---

## 3. Directory Layouts

### Frontend (`frontend/src/`)
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

### Backend (`backend/`)
```text
backend/
├── core/                       # Server runtime configuration
│   ├── config.py
│   ├── rate_limit.py
│   └── security.py
├── features/                   # 1:1 Matching Feature Modules
│   ├── subjects_ai/            # router.py, schemas.py, service.py
│   ├── project_analysis/       # router.py, schemas.py, service.py
│   ├── resume_reviewer/        # router.py, schemas.py, service.py
│   └── daily_quiz/             # router.py, schemas.py, service.py
├── shared/                     # Health check endpoint
│   └── health.py
├── main.py                     # Registers routers under /api/v1/...
└── requirements.txt
```

### Supabase (`supabase/`)
```text
supabase/
└── migrations/                 # Migrations partitioned per feature
    ├── core.sql                # Shared tables (profiles, subjects, enrollments)
    ├── communities.sql         # Communities posts, votes, comments, attachments
    ├── subjects.sql            # Subjects notes & storage
    ├── daily_quiz.sql          # Daily quiz schema
    ├── project_analysis.sql    # Project analysis schema
    ├── resume_reviewer.sql     # Resume reviewer schema
    └── dashboard.sql           # Dashboard preferences schema
```

---

## 4. Quick Start

### Frontend
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

### Backend
```bash
cd backend
python -m venv .venv

# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Health check:
```bash
curl http://localhost:8000/api/v1/health
# {"status":"ok","version":"0.1.0"}
```
