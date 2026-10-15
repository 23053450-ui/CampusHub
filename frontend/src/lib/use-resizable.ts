/**
 * @file use-resizable.ts
 * @description Hook managing horizontal sidebar resizing with bounds clamping and localStorage persistence.
 * @owner Platform UI Core
 */

import { useState, useEffect, useCallback, useRef } from "react";

export interface UseResizableOptions {
  /** "right" means dragging the right edge (left sidebar). "left" means dragging the left edge (right sidebar). */
  direction: "left" | "right";
  /** Default width in pixels */
  defaultWidth: number;
  /** Minimum allowed width in pixels */
  minWidth?: number;
  /** Maximum allowed width in pixels */
  maxWidth?: number;
  /** Optional localStorage key to remember width across sessions */
  storageKey?: string;
}

export function useResizable({
  direction,
  defaultWidth,
  minWidth = 160,
  maxWidth = 600,
  storageKey,
}: UseResizableOptions) {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window !== "undefined" && storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = Number(stored);
          if (!Number.isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
            return parsed;
          }
        }
      } catch {
        // Fallback to default
      }
    }
    return defaultWidth;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const resetWidth = useCallback(() => {
    setWidth(defaultWidth);
    if (storageKey && typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, String(defaultWidth));
      } catch {
        // ignore
      }
    }
  }, [defaultWidth, storageKey]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only respond to primary mouse / touch button
      if (e.button !== 0) return;

      e.preventDefault();
      setIsDragging(true);
      dragStateRef.current = {
        startX: e.clientX,
        startWidth: width,
      };

      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    },
    [width]
  );

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e: PointerEvent) => {
      if (!dragStateRef.current) return;
      const { startX, startWidth } = dragStateRef.current;
      const delta = direction === "right" ? e.clientX - startX : startX - e.clientX;
      const rawWidth = startWidth + delta;
      const clampedWidth = Math.min(Math.max(rawWidth, minWidth), maxWidth);

      setWidth(clampedWidth);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, String(clampedWidth));
        } catch {
          // ignore
        }
      }
    };

    const onPointerUp = () => {
      setIsDragging(false);
      dragStateRef.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, direction, minWidth, maxWidth, storageKey]);

  return {
    width,
    setWidth,
    isDragging,
    resetWidth,
    handleProps: {
      onPointerDown: handlePointerDown,
      onDoubleClick: resetWidth,
    },
  };
}
