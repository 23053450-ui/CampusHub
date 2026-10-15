/**
 * @file resize-handle.tsx
 * @description Draggable splitter handle for resizable sidebars.
 * @owner Platform UI Core
 */

import React from "react";

export interface ResizeHandleProps {
  side: "left" | "right";
  isDragging?: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onDoubleClick?: () => void;
  className?: string;
}

export function ResizeHandle({
  side,
  isDragging,
  onPointerDown,
  onDoubleClick,
  className = "",
}: ResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      tabIndex={0}
      title="Drag to resize, double-click to reset"
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className={`absolute top-0 bottom-0 z-20 flex w-3 items-center justify-center cursor-col-resize select-none group touch-none ${
        side === "right" ? "-right-1.5" : "-left-1.5"
      } ${className}`}
    >
      <div
        className={`w-[2px] h-full transition-colors duration-150 ${
          isDragging
            ? "bg-primary w-[3px]"
            : "bg-transparent group-hover:bg-primary/50"
        }`}
      />
    </div>
  );
}
