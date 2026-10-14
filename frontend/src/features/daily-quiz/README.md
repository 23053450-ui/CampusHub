# Feature Guide: Daily Quiz (`features/daily-quiz`)

**Scope:** Daily CS fundamentals practice quiz, timer, scoring, and streak tracking.  
**Frontend Route:** `/daily-quiz`  
**Backend Counterpart:** [`backend/features/daily_quiz/`](../../../../backend/features/daily_quiz/README.md)  
**Supabase Requirement:** **Requires Supabase** (streaks and question bank tracking).

---

## 1. Developer Ownership

- **Your Workspace:** `frontend/src/features/daily-quiz/`
- **Main Component:** `DailyQuizPage.tsx`
- **Service Layer:** `services/`
  - `services/types.ts` — `DailyQuizService` interface with question set, submission, and streak signatures.
  - `services/mockService.ts` — Mock 3-question CS test, instant grading, and simulated streak increments.
  - `services/realService.ts` — FastAPI endpoints (`/today`, `/submit`) + Supabase streak tracking.
  - `services/index.ts` — Automatic dispatcher governed by `VITE_USE_MOCKS`.

---

## 2. Mock-First Development Workflow

### Step 1: Build the UI using Mock Services
1. Ensure `VITE_USE_MOCKS=true` in `frontend/.env`.
2. Inspect or customize questions and explanations in [`services/mockService.ts`](services/mockService.ts).
3. Import and use `dailyQuizService` in `DailyQuizPage.tsx`:
   ```typescript
   import { dailyQuizService } from "./services";

   // Fetch today's questions and current streak:
   const { data: quizData } = await dailyQuizService.getTodayQuiz();
   const { data: streak } = await dailyQuizService.getUserStreak();

   // Submit answers at the end of the test:
   const { data: result } = await dailyQuizService.submitQuiz(userAnswers);
   ```
4. Build the quiz runner: countdown timer, single-choice option selectors, progress indicators, score celebration dialog, and explanation drawers.

### Step 2: Connect Live Backend & Supabase
When the quiz player works smoothly:
1. Ensure the FastAPI backend server is running.
2. In [`services/realService.ts`](services/realService.ts), endpoints are connected:
   - `GET /api/v1/daily-quiz/today` retrieves the active daily question set.
   - `POST /api/v1/daily-quiz/submit` validates answers and returns score.
   - Supabase `user_streaks` records student practice streaks.
3. Switch `VITE_USE_MOCKS=false` in `frontend/.env` to run with real backend services.
