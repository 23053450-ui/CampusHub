# Component Guide: AI Companion (`components/ai-companion`)

**Scope:** The right-hand AI study companion panel embedded within the 3-Pane Subject Workspace.  
**Backend API:** FastAPI `/api/v1/subjects-ai/*`

---

## 1. Responsibilities

- **Chat with Document (`POST /api/v1/subjects-ai/chat`):** Contextual Q&A using text from the currently active PDF tab in the center viewer.
- **AI Flashcards (`POST /api/v1/subjects-ai/flashcards`):** Auto-generates study flashcards from the open note text.
- **Document Quiz (`POST /api/v1/subjects-ai/quiz`):** Auto-generates 5-question comprehension quiz.

---

## 2. Why this is embedded inside `subjects/`

Placing `ai-companion` directly inside `subjects/` allows the AI panel to directly read the active tab state, highlighted text, and current PDF page without requiring complicated cross-feature state stores.
