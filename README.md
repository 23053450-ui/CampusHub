# CampusHub

CampusHub is a campus learning and collaboration platform that brings together student community discussions, academic resource archives, split-pane subject study workspaces with AI companions, and standalone technical tools.

---

## 1. System Architecture

The project is structured into three clean layers:

- **`frontend/`**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui.
  - **App Shell:** Collapsible sidebar (with toggle to hide/show) and minimal header with toggle on left and student account avatar on right.
  - **Clean Canvas:** Unpopulated page views ready for feature development.
- **`backend/`**: FastAPI service running in Python 3.11+.
  - **`core/`**: Strict framework runtime (settings, CORS, auth security, rate limiting).
  - **`features/`**: 1:1 matching feature modules (`subjects_ai`, `project_analysis`, `resume_reviewer`, `daily_quiz`), each with isolated `router.py`, `schemas.py`, and `service.py`. Features interact with libraries (such as Google GenAI) directly.
- **`supabase/`**: PostgreSQL database with Row Level Security (RLS) policies, storage buckets (`public-attachments`, `subject-notes`), and stored procedures (`vote_post`).

---

## 2. 1:1 Developer Ownership Matrix

Every developer is assigned **one isolated feature folder in Frontend (+ 1 matching folder in Backend if it uses FastAPI)** with zero overlapping files or merge conflicts:

| Feature / Module | Frontend Path | Backend Path | Data & API Flow |
| :--- | :--- | :--- | :--- |
| **App Shell & Dashboard** | [`src/features/dashboard/`](frontend/src/features/dashboard/README.md) | *None* | Direct **Supabase** (enrolled subjects & profile) |
| **Communities** (Forum + Archive) | [`src/features/communities/`](frontend/src/features/communities/README.md) | *None* | Direct **Supabase** (`posts`, `comments`, `notes`, `vote_post` RPC, storage) |
| **Subject Workspace & Doc AI** | [`src/features/subjects/`](frontend/src/features/subjects/README.md) | [`backend/features/subjects_ai/`](backend/features/subjects_ai/README.md) | Notes via **Supabase**; AI panel calls **FastAPI** `/api/v1/subjects-ai/*` |
| **GitHub Project Analysis** | [`src/features/project-analysis/`](frontend/src/features/project-analysis/README.md) | [`backend/features/project_analysis/`](backend/features/project_analysis/README.md) | Purely stateless via **FastAPI** `/api/v1/project-analysis/analyze` |
| **ATS Resume Reviewer** | [`src/features/resume-reviewer/`](frontend/src/features/resume-reviewer/README.md) | [`backend/features/resume_reviewer/`](backend/features/resume_reviewer/README.md) | Purely stateless via **FastAPI** `/api/v1/resume-reviewer/review` |
| **Daily CS Quiz** | [`src/features/daily-quiz/`](frontend/src/features/daily-quiz/README.md) | [`backend/features/daily_quiz/`](backend/features/daily_quiz/README.md) | **FastAPI** `/api/v1/daily-quiz/*` + Supabase quiz attempts |

---

## 3. Directory Layouts

### Frontend (`frontend/src/`)
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
└── features/                   # 🎯 1 Folder = 1 Developer Ownership (with services/ for mock & real APIs)
    ├── dashboard/              # [Supabase Only] Dashboard overview (services/mockService.ts, realService.ts)
    ├── communities/            # [Supabase Only] Forum & notes archive (services/mockService.ts, realService.ts)
    ├── subjects/               # [Supabase + FastAPI] 3-Pane Workspace (services/mockService.ts, realService.ts)
    │   └── components/ai-companion/  # Right-pane Document AI companion
    ├── project-analysis/       # [FastAPI Only - Stateless] GitHub audit (services/mockService.ts, realService.ts)
    ├── resume-reviewer/        # [FastAPI Only - Stateless] ATS review (services/mockService.ts, realService.ts)
    └── daily-quiz/             # [FastAPI + Supabase] Daily CS quiz (services/mockService.ts, realService.ts)
```

### Backend (`backend/`)
```text
backend/
├── core/                       # Strict server runtime ONLY
│   ├── config.py               # Settings & environment variables
│   ├── rate_limit.py           # In-memory rate limiting
│   └── security.py             # JWT bearer auth & Supabase token validation
├── features/                   # 🎯 1:1 Matching with Frontend Features
│   ├── subjects_ai/            # Serves Subject Workspace AI Companion
│   │   ├── router.py           # POST /chat, /flashcards, /quiz
│   │   ├── schemas.py          # Pydantic request/response models
│   │   ├── service.py          # Prompt templates & LLM execution
│   │   └── README.md
│   ├── project_analysis/       # Serves features/project-analysis
│   │   ├── router.py           # POST /analyze
│   │   ├── schemas.py
│   │   ├── service.py          # GitHub tree audit & prompt execution
│   │   └── README.md
│   ├── resume_reviewer/        # Serves features/resume-reviewer
│   │   ├── router.py           # POST /review
│   │   ├── schemas.py
│   │   ├── service.py          # In-memory PDF parsing & ATS evaluation
│   │   └── README.md
│   └── daily_quiz/             # Serves features/daily-quiz
│       ├── router.py           # GET /today, POST /submit
│       ├── schemas.py
│       ├── service.py          # Question retrieval & streak logic
│       └── README.md
├── shared/                     # Common health schemas
├── main.py                     # Registers routers under /api/v1/...
└── requirements.txt
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
