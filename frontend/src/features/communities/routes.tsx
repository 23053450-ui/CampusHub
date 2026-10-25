import type { RouteObject } from "react-router-dom";
import CommunitiesLayout from "./CommunitiesLayout";
import CommunitiesPage from "./CommunitiesPage";
import PostDetailPage from "./PostDetailPage";
import CreatePostPage from "./CreatePostPage";

export const communitiesRoute: RouteObject = {
  path: "communities",
  element: <CommunitiesLayout />,
  children: [
    { index: true, element: <CommunitiesPage /> },
    { path: "new", element: <CreatePostPage /> },
    { path: "post/:postId", element: <PostDetailPage /> },
    { path: ":subjectId", element: <CommunitiesPage /> },
    { path: ":subjectId/new", element: <CreatePostPage /> },
    { path: ":subjectId/post/:postId", element: <PostDetailPage /> },
  ],
};
