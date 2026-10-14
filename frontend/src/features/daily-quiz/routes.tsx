import type { RouteObject } from "react-router-dom";
import DailyQuizPage from "./DailyQuizPage";

export const dailyQuizRoute: RouteObject = {
  path: "daily-quiz",
  element: <DailyQuizPage />,
};
