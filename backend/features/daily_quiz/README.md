# Backend Feature: Daily Quiz (`features/daily_quiz`)

**Scope:** Serves the Daily CS Practice Quiz (`frontend/src/features/daily-quiz/`).  
**Router Prefix:** `/api/v1/daily-quiz`  
**Endpoints:**
- `GET /api/v1/daily-quiz/today` — Retrieve today's questions.
- `POST /api/v1/daily-quiz/submit` — Submit answers and update streaks.
**Supabase Requirement:** **Requires Supabase** (questions bank, attempts, streaks).

---

## 1. Directory Structure

```
backend/features/daily_quiz/
├── router.py       # HTTP route controller
├── schemas.py      # Request & Response models
├── service.py      # Question retrieval & streak evaluation logic
└── README.md
```

---

## 2. Developer Freedom & Supabase Integration

Developers have full freedom to design the question bank schema, difficulty progression, and streak calculations.
