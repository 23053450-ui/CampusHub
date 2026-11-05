/**
 * @file CommunityHeader.tsx
 * @description Forum banner header displaying community details, member stats, and pin toggle.
 * @owner Communities Team
 */

import React, { useEffect, useState } from "react";
import { Users, Network, ShieldCheck, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { communitiesService } from "../services";
import type { SubjectForum, CommunityModerator } from "../services/types";

interface CommunityHeaderProps {
  forum: SubjectForum;
  isPinned?: boolean;
  isEnrolled?: boolean;
  onTogglePin?: () => void;
}

export function CommunityHeader({
  forum,
  isPinned = false,
  isEnrolled = false,
  onTogglePin,
}: CommunityHeaderProps) {
  const [moderators, setModerators] = useState<CommunityModerator[]>([]);

  useEffect(() => {
    if (!forum.id) return;
    let isMounted = true;
    if (communitiesService.getCommunityModerators) {
      communitiesService.getCommunityModerators(forum.id).then((res) => {
        if (isMounted && res.data) {
          setModerators(res.data);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [forum.id]);

  // Format member count into k format, e.g. 1.2k
  const formattedCount =
    forum.memberCount >= 1000
      ? `${(forum.memberCount / 1000).toFixed(1)}k`
      : `${forum.memberCount}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xs">
      {/* Clean Top Banner Header Accent */}
      <div className="h-20 sm:h-24 w-full bg-gradient-to-r from-primary/10 via-primary/5 to-muted/40 border-b border-border/50 select-none" />

      {/* Content Area - cleanly separated with solid background */}
      <div className="px-5 sm:px-6 pb-5 pt-0 -mt-10 relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="flex items-start sm:items-end gap-3.5 sm:gap-4 min-w-0 flex-1">
          {/* Avatar Icon */}
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-card border-2 border-background shadow-md flex items-center justify-center shrink-0 text-primary">
            <Network className="h-9 w-9 sm:h-11 sm:w-11 stroke-[1.5]" />
          </div>

          {/* Title, Stats & Moderators */}
          <div className="pt-2 sm:pt-4 space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                {forum.name}
              </h1>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/80">
                {forum.code}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground font-medium flex-wrap">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {formattedCount} users
              </span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Moderators:</span>
                {moderators.length > 0 ? (
                  moderators.map((m) => (
                    <span key={m.userId} className="text-foreground font-semibold">
                      @{m.handle || m.fullName?.toLowerCase().replace(/\s+/g, "_") || "mod"}
                    </span>
                  ))
                ) : (
                  <span className="italic">None assigned</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button: Pin option only when user is NOT already enrolled */}
        {!isEnrolled && onTogglePin && (
          <Button
            type="button"
            variant={isPinned ? "secondary" : "outline"}
            size="sm"
            onClick={onTogglePin}
            className={`h-8 gap-1.5 text-xs font-semibold shadow-xs cursor-pointer shrink-0 ${
              isPinned
                ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                : "border-border/80 text-muted-foreground hover:text-foreground"
            }`}
            title={isPinned ? "Unpin forum from sidebar" : "Pin forum to sidebar"}
          >
            <Pin className={`h-3.5 w-3.5 ${isPinned ? "fill-current text-primary" : ""}`} />
            <span>{isPinned ? "Pinned" : "Pin Forum"}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
