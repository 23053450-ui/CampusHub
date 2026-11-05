import type { RouteObject } from "react-router-dom";
import DashboardPage from "./DashboardPage";

export const dashboardRoute: RouteObject = {
  index: true,
  element: <DashboardPage />,
};

export const dashboardAliasRoute: RouteObject = {
  path: "dashboard",
  element: <DashboardPage />,
};

