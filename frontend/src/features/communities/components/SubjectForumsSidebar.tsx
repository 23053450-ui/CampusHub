/**
 * @file SubjectForumsSidebar.tsx
 * @description Secondary sidebar for navigating enrolled and pinned subject forums.
 * @owner Communities Team
 */

import React from "react";
import { ChevronLeft, ChevronRight, Pin, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SubjectForum } from "../services/types";

interface SubjectForumsSidebarProps {
  forums: SubjectForum[];
  activeSubjectId: string;
  onSelectSubject: (subjectId: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function SubjectForumsSidebar({
  forums,
  activeSubjectId,
  onSelectSubject,
  isOpen,
  onToggleOpen,
}: SubjectForumsSidebarProps) {
  const enrolledForums = forums.filter((f) => !f.isPinned);
  const pinnedForums = forums.filter((f) => f.isPinned);

  if (!isOpen) {
    return (
      <div className="border-r bg-card/40 flex flex-col items-center py-3 px-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleOpen}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Open subject forums"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className="w-64 border-r bg-card/30 flex flex-col shrink-0 p-3 select-none">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between px-2 py-1 mb-2">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          My Subject forums
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleOpen}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title="Collapse forums"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Enrolled Subjects List */}
      <div className="space-y-1 overflow-y-auto max-h-[45vh]">
        {enrolledForums.map((forum) => {
          const isActive = forum.id === activeSubjectId;
          return (
            <button
              key={forum.id}
              type="button"
              onClick={() => onSelectSubject(forum.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all flex items-center justify-between ${
                isActive
                  ? "bg-secondary/90 border border-primary/20 text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-muted-foreground">•</span>
                <span className="truncate">{forum.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pinned Forums Section */}
      {pinnedForums.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center gap-1.5 px-2 py-1 mb-1 text-xs font-semibold text-muted-foreground">
            <Pin className="h-3.5 w-3.5" />
            <span>Pinned Forums</span>
          </div>
          <div className="space-y-1">
            {pinnedForums.map((forum) => {
              const isActive = forum.id === activeSubjectId;
              return (
                <button
                  key={forum.id}
                  type="button"
                  onClick={() => onSelectSubject(forum.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all flex items-center justify-between ${
                    isActive
                      ? "bg-secondary/90 border border-primary/20 text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-muted-foreground">•</span>
                    <span className="truncate">{forum.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

