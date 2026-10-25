/**
 * @file ResourceTable.tsx
 * @description List view for displaying academic notes and PYQs matching wireframe layout.
 * @owner Communities Team
 */

import React from "react";
import { FileText, Download, ExternalLink, Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResourceNote } from "../services/types";

interface ResourceTableProps {
  resources: ResourceNote[];
  isLoading: boolean;
  emptyMessage: string;
}

export function ResourceTable({
  resources,
  isLoading,
  emptyMessage,
}: ResourceTableProps) {
  // Format relative timestamp
  const formatTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 1) return "today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-3 space-y-2">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center space-y-2">
        <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">No resources found</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card divide-y overflow-hidden shadow-xs">
      {resources.map((item) => (
        <div
          key={item.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:px-4 sm:py-3.5 hover:bg-muted/40 transition-colors group"
        >
          {/* File Name & Icon */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="truncate">
              <span className="text-xs sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer truncate block">
                {item.title}
              </span>
            </div>
          </div>

          {/* Metadata & Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 text-xs text-muted-foreground pl-11 sm:pl-0">
            <span className="font-medium text-foreground/80">
              {item.uploaderHandle}
            </span>
            <span>•</span>
            <span>{item.pageCount} pages</span>
            <span>•</span>
            <span>{formatTime(item.createdAt)}</span>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0"
              title="Download / View"
              onClick={() => {
                alert(`Opening/Downloading: ${item.title}`);
              }}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

