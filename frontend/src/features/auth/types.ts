/**
 * @file types.ts
 * @description Types and interfaces for authentication and session management.
 * @owner Platform Core Team
 */

import type { UserProfile, UserRole } from "@/shared/user";

export interface MockAccount {
  email: string;
  password: string;
  role: UserRole;
  profile: UserProfile;
}

export interface AuthSession {
  accessToken: string;
  user: UserProfile;
}

