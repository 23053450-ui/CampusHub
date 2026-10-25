/**
 * @file PostFeed.tsx
 * @description Feed component with sort controls, new post button, and list of post threads.
 * @owner Communities Team
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MessageSquareDashed, Search } from "lucide-react";
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
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function PostFeed({
  posts,
  isLoading,
  subjectName,
  subjectId,
  sortBy,
  onSortChange,
  onVote,
  searchQuery,
  onClearSearch,
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
      {/* Active Search Filter Status */}
      {searchQuery && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground truncate mr-2">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="shrink-0">Searching titles for:</span>
            <span className="font-semibold text-foreground truncate">"{searchQuery}"</span>
            <span className="shrink-0 text-muted-foreground">
              ({posts.length} {posts.length === 1 ? "match" : "matches"})
            </span>
          </div>
          {onClearSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSearch}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            >
              Clear filter
            </Button>
          )}
        </div>
      )}

      {/* Action Bar matching wireframe: [New v] on left, [+ New Post] on right */}
      <div className="flex items-center justify-between gap-3 pt-1">
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
        searchQuery ? (
          <div className="rounded-xl border border-dashed p-10 text-center space-y-2">
            <Search className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <h4 className="text-sm font-semibold text-foreground">
              No post titles matching "{searchQuery}"
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              We couldn't find any discussion posts in {subjectName} with titles containing this search term.
            </p>
            {onClearSearch && (
              <Button
                size="sm"
                variant="outline"
                onClick={onClearSearch}
                className="mt-2 text-xs cursor-pointer"
              >
                Clear search filter
              </Button>
            )}
          </div>
        ) : (
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
        )
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onVote={onVote}
              highlightQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}
