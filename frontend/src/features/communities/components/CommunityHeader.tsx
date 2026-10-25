/**
 * @file CommunityHeader.tsx
 * @description Forum banner header displaying community details, member stats, and artwork.
 * @owner Communities Team
 */

import React from "react";
import { Users, Share2, Network } from "lucide-react";
import type { SubjectForum } from "../services/types";

interface CommunityHeaderProps {
  forum: SubjectForum;
}

export function CommunityHeader({ forum }: CommunityHeaderProps) {
  // Format member count into k format, e.g. 1.2k
  const formattedCount =
    forum.memberCount >= 1000
      ? `${(forum.memberCount / 1000).toFixed(1)}k`
      : `${forum.memberCount}`;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
      {/* Abstract Banner Artwork / Doodles */}
      <div className="h-28 sm:h-32 w-full bg-linear-to-r from-muted/60 via-secondary/40 to-muted/80 relative overflow-hidden flex items-center justify-end px-8 pointer-events-none select-none">
        {/* Subtle decorative SVGs mimicking sketch lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-15 stroke-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          strokeWidth="1.5"
        >
          <path d="M10 20 Q 80 80, 160 30 T 320 60 T 480 20 T 640 50 T 800 25 T 960 70" />
          <path d="M50 70 Q 150 10, 250 60 T 450 40 T 650 70 T 850 35" />
          <path d="M200 90 L 220 80 L 240 95 M 500 25 L 515 35 L 530 15 M 720 75 L 735 60 L 750 80" />
          <path d="M300 20 C 340 70, 380 10, 420 50" />
          <path d="M600 80 C 650 30, 700 90, 750 40" />
        </svg>
      </div>

      {/* Community Info Overlay */}
      <div className="p-4 sm:p-5 flex items-start gap-4 -mt-10 sm:-mt-12 relative z-10">
        {/* Community Network Avatar */}
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-card border-2 border-background shadow-md flex items-center justify-center shrink-0 text-primary">
          <Network className="h-9 w-9 sm:h-11 sm:w-11 stroke-[1.5]" />
        </div>

        {/* Title & Stats */}
        <div className="pt-2 sm:pt-4 space-y-1 min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
            {forum.name}
          </h2>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {formattedCount} users
            </span>
            <span>•</span>
            <span className="font-mono text-xs">{forum.code}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

