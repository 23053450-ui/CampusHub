import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import { dashboardRoute } from "@/features/dashboard/routes";
import { communitiesRoute } from "@/features/communities/routes";
import { subjectsRoute } from "@/features/subjects/routes";
import { projectAnalysisRoute } from "@/features/project-analysis/routes";
import { resumeReviewerRoute } from "@/features/resume-reviewer/routes";
import { dailyQuizRoute } from "@/features/daily-quiz/routes";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      dashboardRoute,
      communitiesRoute,
      subjectsRoute,
      projectAnalysisRoute,
      resumeReviewerRoute,
      dailyQuizRoute,
    ],
  },
]);
