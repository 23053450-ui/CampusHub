import type { RouteObject } from "react-router-dom";
import SubjectWorkspacePage from "./SubjectWorkspacePage";

export const subjectsRoute: RouteObject = {
  path: "subjects/:subjectId",
  element: <SubjectWorkspacePage />,
};
