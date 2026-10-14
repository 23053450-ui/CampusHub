import React, { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";

const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const CommunitiesPage = lazy(() => import("@/features/communities/CommunitiesPage"));
const SubjectWorkspacePage = lazy(() => import("@/features/subjects/SubjectWorkspacePage"));
const ProjectAnalysisPage = lazy(() => import("@/features/project-analysis/ProjectAnalysisPage"));
const ResumeReviewerPage = lazy(() => import("@/features/resume-reviewer/ResumeReviewerPage"));
const DailyQuizPage = lazy(() => import("@/features/daily-quiz/DailyQuizPage"));

const SuspenseFallback = () => <div className="h-full w-full" />;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      // Feature 1: Communities (Forum + Resources)
      {
        path: "communities",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <CommunitiesPage />
          </Suspense>
        ),
      },
      {
        path: "communities/:subjectId",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <CommunitiesPage />
          </Suspense>
        ),
      },
      // Feature 2: 3-Pane Subject Workspace
      {
        path: "subjects/:subjectId",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <SubjectWorkspacePage />
          </Suspense>
        ),
      },
      // Feature 3: Project Analysis
      {
        path: "project-analysis",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <ProjectAnalysisPage />
          </Suspense>
        ),
      },
      // Feature 4: Resume Reviewer
      {
        path: "resume-reviewer",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <ResumeReviewerPage />
          </Suspense>
        ),
      },
      // Feature 5: Daily Quiz
      {
        path: "daily-quiz",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <DailyQuizPage />
          </Suspense>
        ),
      },
      // Fallback
      {
        path: "*",
        element: <SuspenseFallback />,
      },
    ],
  },
]);
