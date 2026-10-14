# Backend Feature: Project Analysis (`features/project_analysis`)

**Scope:** Serves the GitHub Project Analyzer (`frontend/src/features/project-analysis/`).  
**Router Prefix:** `/api/v1/project-analysis`  
**Endpoint:** `POST /api/v1/project-analysis/analyze`  
**Supabase Requirement:** **None (100% Stateless)**

---

## 1. Directory Structure

```
backend/features/project_analysis/
├── router.py       # HTTP route controller
├── schemas.py      # Request & Response Pydantic models
├── service.py      # Repository fetching & AI prompt execution
└── README.md
```

---

## 2. API Contract

- **Request:**
  ```json
  {
    "github_url": "https://github.com/facebook/react"
  }
  ```
- **Response:**
  ```json
  {
    "repositoryName": "react",
    "techStack": ["React", "JavaScript"],
    "architectureSummary": "Monorepo containing React core packages.",
    "strengths": ["Comprehensive test coverage"],
    "criticalIssues": [],
    "recommendations": ["Consider migrating Flow types to TypeScript"]
  }
  ```
