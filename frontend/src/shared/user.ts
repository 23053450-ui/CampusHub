/**
 * @file user.ts
 * @description User profile and subject structure types.
 * @owner Platform Core Team
 */

export type UserRole = "student" | "moderator" | "admin";

export interface UserProfile {
  id: string;
  handle: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}
