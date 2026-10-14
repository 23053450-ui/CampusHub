---
trigger: always_on
---

# Repository Skeleton & Feature Isolation Rules

1. **The One Rule for Skeleton Scaffolding**:
   - Skeleton files must contain ONLY a header comment stating the file purpose and owner, plus the minimal scaffolding needed to compile/run.
   - Do not introduce data models, mock datasets, endpoint implementations, LLM prompts, or business logic during skeleton phase.

2. **Feature Isolation**:
   - Frontend features (`src/features/*`) must be fully isolated from each other.
   - Never import from another feature folder. Imports are only permitted from `components/ui`, `lib/`, `shared/`, and the feature's own directory.
   - Each frontend feature exports its own route object; `app/routes.tsx` only aggregates them.
   - Backend features (`backend/features/*`) contain isolated routers mounted in `main.py` with individual prefixes.

3. **Global Type Scope**:
   - `src/shared/` contains only universal platform types (`result.ts`, `user.ts`).
   - Feature-specific models are owned and defined exclusively within their respective feature folders.
