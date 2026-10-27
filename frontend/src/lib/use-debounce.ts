/**
 * @file use-debounce.ts
 * @description Custom hook that delays updating a value until after the specified debounce delay.
 * @owner Platform UI Core
 */

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delayMs: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
