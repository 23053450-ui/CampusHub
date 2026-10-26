/**
 * @file routes.tsx
 * @description Route definitions for Auth feature.
 * @owner Platform Core Team
 */

import type { RouteObject } from "react-router-dom";
import LoginPage from "./LoginPage";

export const authRoute: RouteObject = {
  path: "/login",
  element: <LoginPage />,
};

