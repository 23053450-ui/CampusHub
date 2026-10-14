import type { RouteObject } from "react-router-dom";
import ProjectAnalysisPage from "./ProjectAnalysisPage";

export const projectAnalysisRoute: RouteObject = {
  path: "project-analysis",
  element: <ProjectAnalysisPage />,
};
