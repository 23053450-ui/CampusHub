# Backend Feature: Resume Reviewer (`features/resume_reviewer`)

**Scope:** Serves the AI Resume Reviewer (`frontend/src/features/resume-reviewer/`).  
**Router Prefix:** `/api/v1/resume-reviewer`  
**Endpoint:** `POST /api/v1/resume-reviewer/review`  
**Supabase Requirement:** **None (100% Stateless)**

---

## 1. Directory Structure

```
backend/features/resume_reviewer/
├── router.py       # HTTP route controller
├── schemas.py      # Response Pydantic model
├── service.py      # In-memory PDF parsing & AI ATS review logic
└── README.md
```

---

## 2. API Contract

- **Method:** `POST` (`multipart/form-data`)
- **Fields:**
  - `file`: PDF file (`UploadFile`, max 5 MiB)
  - `target_role`: Optional string (e.g. `"Full Stack Engineer"`)
- **Response:**
  ```json
  {
    "score": 85,
    "summary": "ATS analysis for uploaded resume.",
    "strengths": ["Clear technical project section"],
    "improvements": ["Add quantifiable outcome metrics"],
    "suggestedKeywords": ["FastAPI", "React", "TypeScript"]
  }
  ```
