/**
 * @file PostCard.tsx
 * @description Card component for previewing discussion threads with upvoting and comment count.
 * @owner Communities Team
 */

import React from "react";
import { ArrowBigUp, ArrowBigDown, MessageSquare, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Post } from "../services/types";

interface PostCardProps {
  post: Post;
  onVote: (postId: string, vote: 1 | -1 | null) => void;
  onOpenComments: (post: Post) => void;
}

export function PostCard({ post, onVote, onOpenComments }: PostCardProps) {
  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVote = post.currentUserVote === 1 ? null : 1;
    onVote(post.id, newVote);
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVote = post.currentUserVote === -1 ? null : -1;
    onVote(post.id, newVote);
  };

  // Format relative timestamp
  const formatTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) {
      const minutes = Math.floor(diffMs / (1000 * 60));
      return `${Math.max(1, minutes)}m ago`;
    }
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div
      onClick={() => onOpenComments(post)}
      className="group rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-xs cursor-pointer select-none space-y-3"
    >
      {/* Author and metadata */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            {post.authorAvatarUrl && <AvatarImage src={post.authorAvatarUrl} alt={post.authorHandle} />}
            <AvatarFallback className="text-[10px] bg-secondary font-semibold">
              {post.authorHandle.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground hover:underline">
            {post.authorHandle}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatTime(post.createdAt)}</span>
        </div>
      </div>

      {/* Post Title & Body */}
      <div>
        <h3 className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
          {post.title}
        </h3>
        {post.body && (
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {post.body}
          </p>
        )}
      </div>

      {/* Post Footer Actions: Upvote/Downvote & Comments */}
      <div className="flex items-center gap-3 pt-1">
        {/* Voting capsule */}
        <div
          className="flex items-center rounded-lg border bg-secondary/50 px-1 py-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleUpvote}
            className={`p-1 rounded-sm transition-colors hover:bg-muted ${
              post.currentUserVote === 1
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Upvote"
          >
            <ArrowBigUp className={`h-4 w-4 ${post.currentUserVote === 1 ? "fill-primary" : ""}`} />
          </button>
          <span
            className={`px-1 text-xs font-semibold ${
              post.currentUserVote === 1
                ? "text-primary"
                : post.currentUserVote === -1
                ? "text-destructive"
                : "text-foreground"
            }`}
          >
            {post.upvotes}
          </span>

          <button
            type="button"
            onClick={handleDownvote}
            className={`p-1 rounded-sm transition-colors hover:bg-muted ${
              post.currentUserVote === -1
                ? "text-destructive font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Downvote"
          >
            <ArrowBigDown className={`h-4 w-4 ${post.currentUserVote === -1 ? "fill-destructive" : ""}`} />
          </button>
          {post.downvotes > 0 && (
            <span className="pr-1 text-xs font-semibold text-muted-foreground">
              {post.downvotes}
            </span>
          )}
        </div>

        {/* Reply Count Capsule */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenComments(post);
          }}
          className="flex items-center gap-1.5 rounded-lg border bg-secondary/30 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{post.replyCount}</span>
        </button>
      </div>
    </div>
  );
}

