/**
 * @file routes.tsx
 * @description Route definition for Subject Viewer feature.
 * @owner Subject Viewer Team
 */

import type { RouteObject } from "react-router-dom";
import SubjectViewerPage from "./SubjectViewerPage";

export const subjectViewerRoute: RouteObject = {
  path: "subjects",
  children: [
    { index: true, element: <SubjectViewerPage /> },
    { path: ":subjectId", element: <SubjectViewerPage /> },
  ],
};
