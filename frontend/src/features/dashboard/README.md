# Feature Guide: Dashboard (`features/dashboard`)

**Scope:** CampusHub home dashboard, student overview, course shortcuts, and tool launchers.  
**Frontend Route:** `/`  
**Data Dependency:** Direct **Supabase** (`profiles`, `subjects`, `subject_enrollments`).

---

## 1. Developer Ownership

- **Your Workspace:** `frontend/src/features/dashboard/`
- **Main Component:** `DashboardPage.tsx`
- **Service Layer:** `services/`
  - `services/types.ts` — `DashboardService` interface.
  - `services/mockService.ts` — Mock profile & enrolled courses with simulated network delay.
  - `services/realService.ts` — Direct Supabase database queries.
  - `services/index.ts` — Automatically selects mock vs real service based on `VITE_USE_MOCKS`.

---

## 2. Mock-First Development Workflow

### Step 1: Build the UI using Mock Services
1. Ensure `VITE_USE_MOCKS=true` in `frontend/.env`.
2. Inspect or customize mock student profile data in [`services/mockService.ts`](services/mockService.ts).
3. In `DashboardPage.tsx`, import and call `dashboardService`:
   ```typescript
   import { dashboardService } from "./services";

   // Fetch data in useEffect or React Query:
   const { data: profile, error } = await dashboardService.getProfile();
   const { data: enrolledSubjects } = await dashboardService.getEnrolledSubjects();
   ```
4. Build all UI cards, tool launcher tiles, and enrolled course shortcuts cleanly using shadcn components.

### Step 2: Implement Real Supabase Queries
When your UI is ready to talk to the live Supabase instance:
1. Open [`services/realService.ts`](services/realService.ts).
2. Wire queries against the Supabase tables:
   - `profiles`: `.from("profiles").select("*").eq("id", user.id).single()`
   - `subject_enrollments`: `.from("subject_enrollments").select("subject_id, subjects(...)").eq("user_id", user.id)`
   - `subjects`: `.from("subjects").select("id, name, code")`
3. Toggle `VITE_USE_MOCKS=false` in `frontend/.env`. Your UI will instantly consume the live data!
