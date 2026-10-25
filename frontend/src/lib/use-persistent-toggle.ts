/**
 * @file use-persistent-toggle.ts
 * @description Hook managing boolean toggle states persisted in browser localStorage across sessions.
 * @owner Platform UI Core
 */

import { useState, useCallback } from "react";

export function usePersistentToggle(
  storageKey: string,
  defaultValue = true
): [boolean, (action?: boolean | ((prev: boolean) => boolean)) => void] {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined" && storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored !== null) {
          return stored === "true";
        }
      } catch {
        // Fallback to defaultValue if localStorage access fails (e.g. private mode quota)
      }
    }
    return defaultValue;
  });

  const setToggle = useCallback(
    (action?: boolean | ((prev: boolean) => boolean)) => {
      setIsOpen((prev) => {
        const next =
          typeof action === "function"
            ? action(prev)
            : typeof action === "boolean"
            ? action
            : !prev;

        if (typeof window !== "undefined" && storageKey) {
          try {
            localStorage.setItem(storageKey, String(next));
          } catch {
            // Ignore storage errors
          }
        }
        return next;
      });
    },
    [storageKey]
  );

  return [isOpen, setToggle];
}
