# Backend Feature: Document AI Suite (`features/subjects_ai`)

**Scope:** Serves the AI companion panel embedded inside the Subject Workspace (`frontend/src/features/subjects/components/ai-companion/`).  
**Router Prefix:** `/api/v1/subjects-ai`

---

## 1. Endpoints

- `POST /api/v1/subjects-ai/chat`: Contextual Q&A against the active note/PDF.
- `POST /api/v1/subjects-ai/flashcards`: Generates 5 study flashcards based on note text.
- `POST /api/v1/subjects-ai/quiz`: Generates a 5-question comprehension quiz based on note text.

---

## 2. Architecture & File Ownership

```
backend/features/subjects_ai/
├── router.py       # HTTP route definitions & dependency injection
├── schemas.py      # Pydantic v2 validation models
├── service.py      # Prompt templates & LLM execution via Google GenAI SDK
└── README.md       # Feature documentation
```

---

## 3. AI Model Rules

- LLM interactions use the official Google GenAI SDK (`google-genai`) directly within the feature folder.
- Prompts, schemas, and API client execution are self-contained inside this feature module.

