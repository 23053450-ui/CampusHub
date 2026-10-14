# CampusHub Backend (FastAPI)

FastAPI service powering AI operations and technical features for CampusHub.

---

## 1. Directory Structure

Each feature developer has an isolated, dedicated workspace inside `features/`:

```
backend/
├── core/                       # Strict framework runtime ONLY
│   ├── config.py               # Pydantic v2 settings & environment variables
│   ├── rate_limit.py           # In-memory sliding window rate limiter
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
├── main.py                     # Registers routers under /api/v1/... (inlines HealthResponse)
└── requirements.txt
```

---

## 2. Feature Workspaces & Data Flow

| Feature Module | Serves Frontend | Supabase Dependency | Endpoints |
| :--- | :--- | :--- | :--- |
| **`features/subjects_ai/`** | `features/subjects/components/ai-companion/` | **None (Stateless)** | `POST /api/v1/subjects-ai/chat`<br/>`POST /api/v1/subjects-ai/flashcards`<br/>`POST /api/v1/subjects-ai/quiz` |
| **`features/project_analysis/`** | `features/project-analysis/` | **None (Stateless)** | `POST /api/v1/project-analysis/analyze` |
| **`features/resume_reviewer/`** | `features/resume-reviewer/` | **None (Stateless)** | `POST /api/v1/resume-reviewer/review` |
| **`features/daily_quiz/`** | `features/daily-quiz/` | **Requires Supabase** | `GET /api/v1/daily-quiz/today`<br/>`POST /api/v1/daily-quiz/submit` |

---

## 3. Local Development

```bash
cd backend
python -m venv .venv

# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Health check:
```bash
curl http://localhost:8000/api/v1/health
# {"status":"ok","version":"0.1.0"}
```
