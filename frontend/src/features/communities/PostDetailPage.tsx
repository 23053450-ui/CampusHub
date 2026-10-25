/**
 * @file PostDetailPage.tsx
 * @description Dedicated Reddit-style full page view for an individual discussion post.
 * @owner Communities Team
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageCarousel } from "./components/ImageCarousel";
import { FormattedText } from "./components/FormattedText";
import { RichContentEditor } from "./components/RichContentEditor";
import { CommentTree } from "./components/CommentTree";
import { toast } from "sonner";
import { communitiesService } from "./services";
import { processCommunityImage } from "./utils/imagePipeline";
import type { Post, Comment, SubjectForum } from "./services/types";

export default function PostDetailPage() {
  const { subjectId, postId } = useParams<{ subjectId?: string; postId?: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [forum, setForum] = useState<SubjectForum | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Top-level comment box state
  const [commentText, setCommentText] = useState("");
  const [commentImages, setCommentImages] = useState<string[]>([]);
  const [isProcessingCommentImages, setIsProcessingCommentImages] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Voting state (same-color for up and down per requirement)
  const [currentUserVote, setCurrentUserVote] = useState<1 | -1 | null>(null);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);

  // 1. Load Post, Forum & Comments
  useEffect(() => {
    if (!postId) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      communitiesService.getPost(postId),
      communitiesService.getComments(postId),
      communitiesService.getSubjectForums(),
    ]).then(([postRes, commentsRes, forumsRes]) => {
      if (!isMounted) return;

      if (postRes.data) {
        setPost(postRes.data);
        setCurrentUserVote(postRes.data.currentUserVote ?? null);
        setUpvotes(postRes.data.upvotes);
        setDownvotes(postRes.data.downvotes);

        const currentSubjectId = subjectId || postRes.data.subjectId;
        if (forumsRes.data) {
          const matched = forumsRes.data.find((f) => f.id === currentSubjectId);
          setForum(matched || null);
        }
      }

      if (commentsRes.data) {
        setComments(commentsRes.data);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [postId, subjectId]);

  // Vote post handler (same color for upvote & downvote)
  const handleVote = async (newVote: 1 | -1 | null) => {
    if (!post) return;

    let nextVote: 1 | -1 | null = currentUserVote === newVote ? null : newVote;
    const prevVote = currentUserVote;

    setCurrentUserVote(nextVote);
    if (prevVote === 1) setUpvotes((v) => Math.max(0, v - 1));
    if (prevVote === -1) setDownvotes((v) => Math.max(0, v - 1));

    if (nextVote === 1) setUpvotes((v) => v + 1);
    if (nextVote === -1) setDownvotes((v) => v + 1);

    await communitiesService.votePost(post.id, nextVote);
  };

  const handleCommentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 2 - commentImages.length;
    if (remaining <= 0) {
      toast.error("Maximum 2 images allowed per comment.");
      e.target.value = "";
      return;
    }

    const toProcess = Array.from(files).slice(0, remaining);
    setIsProcessingCommentImages(true);

    try {
      for (const file of toProcess) {
        try {
          const processed = await processCommunityImage(file, {
            maxDimension: 1600,
            maxSizeBytes: 1024 * 1024,
            initialQuality: 0.85,
          });
          setCommentImages((prev) => [...prev, processed.dataUrl]);
          toast.success(`Attached "${file.name}" (WebP)`);
        } catch (err: unknown) {
          toast.error((err as Error).message || `Failed to process "${file.name}".`);
        }
      }
    } finally {
      setIsProcessingCommentImages(false);
      e.target.value = "";
    }
  };

  const handleRemoveCommentImage = (idx: number) => {
    setCommentImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit top-level comment
  const handleCreateTopLevelComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentText.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const res = await communitiesService.createComment(
        post.id,
        commentText.trim(),
        null,
        commentImages
      );
      if (res.error) {
        toast.error(res.error.message || "Failed to submit comment.");
        return;
      }
      if (res.data) {
        setComments((prev) => [...prev, res.data]);
        setCommentText("");
        setCommentImages([]);
        setPost((p) => (p ? { ...p, replyCount: p.replyCount + 1 } : null));
        toast.success("Comment posted!");
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Submit reply to a comment (nested up to 12 levels)
  const handleReplyToComment = async (
    parentId: string,
    body: string,
    images?: string[]
  ) => {
    if (!post || !body.trim()) return;
    const res = await communitiesService.createComment(post.id, body.trim(), parentId, images);
    if (res.error) {
      toast.error(res.error.message || "Failed to submit reply.");
      throw new Error(res.error.message);
    }
    if (res.data) {
      setComments((prev) => [...prev, res.data]);
      setPost((p) => (p ? { ...p, replyCount: p.replyCount + 1 } : null));
      toast.success("Reply posted!");
    }
  };

  const handleVoteComment = async (commentId: string, vote: 1 | -1 | null) => {
    if (communitiesService.voteComment) {
      await communitiesService.voteComment(commentId, vote);
    }
  };

  const formatTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const backUrl = forum ? `/communities/${forum.id}` : "/communities";

  const postImages = post?.images && post.images.length > 0
    ? post.images
    : post?.imageUrl
    ? [post.imageUrl]
    : [];

  return (
    <div className="min-h-full py-4 px-4 sm:px-6 lg:px-8">
      {/* Centered post container without outer card border */}
      <div className="w-full max-w-4xl mx-auto space-y-3">
        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !post ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Post not found or may have been deleted.
            <div className="mt-3">
              <Button size="sm" variant="outline" onClick={() => navigate(backUrl)}>
                Return to Community
              </Button>
            </div>
          </div>
        ) : (
          <article className="space-y-3">
            {/* Reddit-style Header Row: Single Round Back Button + Community info + Meta */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Single circular back button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(backUrl)}
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Back to community"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                {/* Community avatar & tag */}
                <div
                  onClick={() => navigate(backUrl)}
                  className="flex items-center gap-1.5 font-semibold text-foreground hover:underline cursor-pointer"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                    r/
                  </div>
                  <span>{forum?.code || "Forum"}</span>
                </div>

                <span>•</span>
                <span>{formatTime(post.createdAt)}</span>
                <span>•</span>
                <span>u/{post.authorHandle}</span>
              </div>

              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Title (Prominent, leading directly to media/content) */}
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground leading-snug">
              {post.title}
            </h1>

            {/* IMAGES CAROUSEL: Directly above body text */}
            {postImages.length > 0 && (
              <div className="pt-0.5">
                <ImageCarousel
                  images={postImages}
                  title={post.title}
                  className="rounded-xl overflow-hidden shadow-xs"
                />
              </div>
            )}

            {/* Body Text (optional) */}
            {post.body && post.body.trim().length > 0 && (
              <div className="text-sm sm:text-base text-foreground/90 leading-relaxed pt-1">
                <FormattedText content={post.body} />
              </div>
            )}

            {/* Action Bar (Upvote/Downvote pills, comments count, share) */}
            <div className="flex items-center gap-2 pt-2 border-b pb-3">
              {/* Same-color Vote Capsule */}
              <div className="flex items-center rounded-lg border bg-secondary/50 px-1.5 py-0.5">
                <button
                  type="button"
                  onClick={() => handleVote(1)}
                  className={`p-1 rounded-sm transition-colors hover:bg-muted ${
                    currentUserVote === 1
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Upvote"
                >
                  <ArrowBigUp
                    className={`h-4 w-4 ${currentUserVote === 1 ? "fill-primary" : ""}`}
                  />
                </button>

                <span
                  className={`px-1.5 text-xs font-semibold ${
                    currentUserVote !== null ? "text-primary" : "text-foreground"
                  }`}
                >
                  {upvotes - downvotes}
                </span>

                <button
                  type="button"
                  onClick={() => handleVote(-1)}
                  className={`p-1 rounded-sm transition-colors hover:bg-muted ${
                    currentUserVote === -1
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Downvote"
                >
                  <ArrowBigDown
                    className={`h-4 w-4 ${currentUserVote === -1 ? "fill-primary" : ""}`}
                  />
                </button>
              </div>

              {/* Comment Counter Capsule */}
              <div className="flex items-center gap-1.5 rounded-lg border bg-secondary/30 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{post.replyCount}</span>
              </div>

              {/* Share Button */}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                }}
                className="flex items-center gap-1.5 rounded-lg border bg-secondary/30 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                title="Copy link"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </button>
            </div>

            {/* Top-Level Add Comment Section */}
            <div className="pt-2 space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Comment as <span className="text-foreground font-semibold">Hashpotato</span>
              </div>
              <RichContentEditor
                value={commentText}
                onChange={setCommentText}
                placeholder="What are your thoughts?"
                compact={false}
                minHeight="min-h-[80px]"
              />

              {/* Attached Images Preview (up to 2) */}
              {commentImages.length > 0 && (
                <div className="flex gap-2 pt-1">
                  {commentImages.map((img, idx) => (
                    <div key={idx} className="relative group/thumb">
                      <img
                        src={img}
                        alt="Comment attachment"
                        className="h-16 w-16 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCommentImage(idx)}
                        className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-90 hover:opacity-100 shadow-xs"
                        title="Remove image"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Bar: Attach Image + Comment Submit */}
              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-2">
                  {commentImages.length < 2 && (
                    <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-secondary/60 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple={false}
                        onChange={handleCommentImageUpload}
                        disabled={isProcessingCommentImages}
                        className="hidden"
                      />
                      {isProcessingCommentImages ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5" />
                      )}
                      <span>Attach image ({commentImages.length}/2)</span>
                    </label>
                  )}
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateTopLevelComment}
                  disabled={!commentText.trim() || isSubmittingComment || isProcessingCommentImages}
                  className="h-8 px-4 text-xs font-semibold gap-1.5"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MessageSquare className="h-3.5 w-3.5" />
                  )}
                  <span>Comment</span>
                </Button>
              </div>
            </div>

            {/* 12-Level Nested Comments Thread */}
            <div className="pt-4 border-t space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Comments ({comments.length})
              </h3>
              <CommentTree
                comments={comments}
                onReply={handleReplyToComment}
                onVoteComment={handleVoteComment}
              />
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
