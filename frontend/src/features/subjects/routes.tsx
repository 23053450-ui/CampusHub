import type { RouteObject } from "react-router-dom";
import SubjectWorkspacePage from "./SubjectWorkspacePage";

export const subjectsRoute: RouteObject = {
  path: "subjects",
  children: [
    { index: true, element: <SubjectWorkspacePage /> },
    { path: ":subjectId", element: <SubjectWorkspacePage /> },
  ],
};
