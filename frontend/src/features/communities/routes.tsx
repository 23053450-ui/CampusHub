import type { RouteObject } from "react-router-dom";
import CommunitiesPage from "./CommunitiesPage";

export const communitiesRoute: RouteObject = {
  path: "communities",
  children: [
    { index: true, element: <CommunitiesPage /> },
    { path: ":subjectId", element: <CommunitiesPage /> },
  ],
};
