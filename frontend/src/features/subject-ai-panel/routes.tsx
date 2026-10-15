/**
 * @file routes.tsx
 * @description Route definition for Subject AI Panel feature.
 * @owner Subject AI Panel Team
 */

import type { RouteObject } from "react-router-dom";
import SubjectAiPanelPage from "./SubjectAiPanelPage";

export const subjectAiPanelRoute: RouteObject = {
  path: "subjects-ai",
  children: [
    { index: true, element: <SubjectAiPanelPage /> },
    { path: ":subjectId", element: <SubjectAiPanelPage /> },
  ],
};
