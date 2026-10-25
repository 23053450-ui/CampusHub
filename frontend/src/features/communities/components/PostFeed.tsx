/**
 * @file PostFeed.tsx
 * @description Feed component with sort controls, new post button, and list of post threads.
 * @owner Communities Team
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MessageSquareDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "./PostCard";
import type { Post } from "../services/types";

interface PostFeedProps {
  posts: Post[];
  isLoading: boolean;
  subjectName: string;
  subjectId?: string;
  sortBy: "new" | "top" | "hot";
  onSortChange: (sort: "new" | "top" | "hot") => void;
  onVote: (postId: string, vote: 1 | -1 | null) => void;
  onRefresh?: () => void;
}

export function PostFeed({
  posts,
  isLoading,
  subjectName,
  subjectId,
  sortBy,
  onSortChange,
  onVote,
}: PostFeedProps) {
  const navigate = useNavigate();

  const sortLabels: Record<string, string> = {
    new: "New",
    top: "Top",
    hot: "Hot",
  };

  const handleOpenCreatePost = () => {
    if (subjectId) {
      navigate(`/communities/${subjectId}/new`);
    } else {
      navigate("/communities/new");
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar matching wireframe: [New v] on left, [+ New Post] on right */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium">
              <span>{sortLabels[sortBy]}</span>
              <span className="text-muted-foreground text-[10px]">▼</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-28">
            <DropdownMenuItem onClick={() => onSortChange("new")}>New</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("hot")}>Hot</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("top")}>Top</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          onClick={handleOpenCreatePost}
          className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Post</span>
        </Button>
      </div>

      {/* Feed list */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-2">
          <MessageSquareDashed className="mx-auto h-8 w-8 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">No discussions yet</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Be the first student to ask a question or share a tip in the {subjectName} community!
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenCreatePost}
            className="mt-2 text-xs"
          >
            Start a discussion
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onVote={onVote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
