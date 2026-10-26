/**
 * @file authService.ts
 * @description Unified authentication service supporting Supabase Auth and seamless offline mock fallback.
 * @owner Platform Core Team
 */

import { supabase } from "@/lib/supabase";
import type { Result } from "@/shared/result";
import type { UserProfile, UserRole } from "@/shared/user";
import { MOCK_ACCOUNTS } from "./mockAccounts";

const MOCK_STORAGE_KEY = "campushub:mock_session";

export const authService = {
  /**
   * Universal sign-in handler.
   */
  async login(email: string, password: string, isMock: boolean): Promise<Result<UserProfile>> {
    const cleanEmail = email.trim().toLowerCase();

    if (isMock) {
      // 1. Check if email matches any pre-configured mock account
      const match = Object.values(MOCK_ACCOUNTS).find(
        (acc) => acc.email.toLowerCase() === cleanEmail
      );

      if (match) {
        if (password && password !== match.password) {
          return {
            data: null,
            error: { code: "UNAUTHENTICATED", message: "Invalid password. (Check .env.local for mock passwords)" },
          };
        }
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(match.profile));
        return { data: match.profile, error: null };
      }

      // 2. Allow any custom email in mock mode
      const handle = cleanEmail.split("@")[0] || "student";
      const customProfile: UserProfile = {
        id: `mock-${handle}-uuid`,
        handle,
        fullName: handle.replace(/[^a-zA-Z0-9]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        avatarUrl: null,
        role: "student",
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(customProfile));
      return { data: customProfile, error: null };
    }

    // Live Supabase Authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error || !data.user) {
        return {
          data: null,
          error: { code: "UNAUTHENTICATED", message: error?.message || "Sign in failed" },
        };
      }

      const profile = await this.getLiveProfile(data.user.id);
      if (profile) {
        return { data: profile, error: null };
      }

      // Fallback if profile row is provisioning
      return {
        data: {
          id: data.user.id,
          handle: data.user.email?.split("@")[0] || "user",
          fullName: data.user.user_metadata?.full_name || null,
          avatarUrl: data.user.user_metadata?.avatar_url || null,
          role: "student",
          createdAt: data.user.created_at,
        },
        error: null,
      };
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message || "Network error during login" },
      };
    }
  },

  /**
   * Universal sign-up handler.
   */
  async signUp(email: string, password: string, fullName: string, isMock: boolean): Promise<Result<UserProfile>> {
    const cleanEmail = email.trim().toLowerCase();
    const handle = cleanEmail.split("@")[0] || "user";

    if (isMock) {
      const newMockProfile: UserProfile = {
        id: `mock-${handle}-uuid`,
        handle,
        fullName: fullName.trim() || handle,
        avatarUrl: null,
        role: "student",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(newMockProfile));
      return { data: newMockProfile, error: null };
    }

    // Live Supabase Sign Up
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim() || handle,
            handle,
          },
        },
      });

      if (error || !data.user) {
        return {
          data: null,
          error: { code: "INTERNAL", message: error?.message || "Sign up failed" },
        };
      }

      const profile = await this.getLiveProfile(data.user.id);
      return {
        data: profile || {
          id: data.user.id,
          handle,
          fullName: fullName.trim() || handle,
          avatarUrl: null,
          role: "student",
          createdAt: data.user.created_at,
        },
        error: null,
      };
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message || "Network error during sign up" },
      };
    }
  },

  /**
   * Auto-login helper based on VITE_MOCK_ROLE.
   */
  getAutoMockUser(mockRoleEnv?: string): UserProfile | null {
    if (!mockRoleEnv) return null;
    const roleKey = mockRoleEnv.toLowerCase().trim() as UserRole;
    if (MOCK_ACCOUNTS[roleKey]) {
      const profile = MOCK_ACCOUNTS[roleKey].profile;
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(profile));
      return profile;
    }
    return null;
  },

  /**
   * Get cached mock user from localStorage if present.
   */
  getCachedMockUser(): UserProfile | null {
    try {
      const item = localStorage.getItem(MOCK_STORAGE_KEY);
      if (item) {
        return JSON.parse(item) as UserProfile;
      }
    } catch {
      // Ignore parse failure
    }
    return null;
  },

  /**
   * Log out from active mode.
   */
  async logout(isMock: boolean): Promise<void> {
    if (isMock) {
      localStorage.removeItem(MOCK_STORAGE_KEY);
    } else {
      await supabase.auth.signOut();
    }
  },

  /**
   * Live Supabase: Fetch profile from public.profiles table.
   */
  async getLiveProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, handle, full_name, avatar_url, role, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      handle: data.handle,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      role: data.role as UserRole,
      createdAt: data.created_at,
    };
  },
};
