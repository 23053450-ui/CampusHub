# Subjects AI Backend (`backend/features/subjects_ai`)

The Subjects AI backend provides document-grounded AI companion services for subject study workspaces. It delivers contextual explanations, flashcard generation, and study quizzes.

- **Frontend Counterpart:** `frontend/src/features/subject-ai-panel/`
- **Backend Path:** `backend/features/subjects_ai/`
- **Route Prefix:** `/api/v1/subjects-ai`
- **Backend Services:** FastAPI with Google GenAI SDK (Gemini)

Nothing outside this folder may import from it.

---

## 1. Endpoints & Schemas

- **`POST /api/v1/subjects-ai/chat`**: Conversational Q&A grounded in document text.
- **`POST /api/v1/subjects-ai/flashcards`**: Generates study flashcards from note text.
- **`POST /api/v1/subjects-ai/quiz`**: Generates a 5-question comprehension quiz.

Refer to `router.py`, `schemas.py`, and `service.py` within this folder.
