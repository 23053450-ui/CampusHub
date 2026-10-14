/**
 * @file result.ts
 * @description Application result and error handling types.
 * @owner Platform Core Team
 */

export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "RATE_LIMITED"
  | "NETWORK"
  | "INTERNAL";

export interface AppError {
  code: AppErrorCode;
  message: string;
  details?: unknown;
}

export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: AppError };
