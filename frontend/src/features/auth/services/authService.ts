/**
 * @file authService.ts
 * @description Authentication service supporting both live Supabase Auth and offline Mock Mode.
 * @owner Platform Core Team
 */

import { supabase } from "@/lib/supabase";
import type { Result } from "@/shared/result";
import type { UserProfile, UserRole } from "@/shared/user";
import { MOCK_ACCOUNTS } from "./mockAccounts";

const MOCK_STORAGE_KEY = "campushub:mock_session";

export const authService = {
  /**
   * Log in in mock mode using email & password or a role preset.
   */
  loginMock(emailOrRole: string, password?: string): Result<UserProfile> {
    const key = emailOrRole.toLowerCase().trim();

    // Check if directly a role preset key
    if (MOCK_ACCOUNTS[key]) {
      const account = MOCK_ACCOUNTS[key];
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(account.profile));
      return { data: account.profile, error: null };
    }

    // Check by email
    const match = Object.values(MOCK_ACCOUNTS).find((acc) => acc.email.toLowerCase() === key);
    if (!match) {
      return {
        data: null,
        error: { code: "UNAUTHENTICATED", message: "Invalid email or password for mock account." },
      };
    }

    if (password && password !== match.password) {
      return {
        data: null,
        error: { code: "UNAUTHENTICATED", message: "Invalid password for mock account." },
      };
    }

    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(match.profile));
    return { data: match.profile, error: null };
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
   * Clear mock session.
   */
  logoutMock(): void {
    localStorage.removeItem(MOCK_STORAGE_KEY);
  },

  /**
   * Live Supabase: Fetch profile from public.profiles table using current user ID.
   */
  async getLiveProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, handle, full_name, avatar_url, role, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      handle: data.handle,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      role: data.role as UserRole,
      createdAt: data.created_at,
    };
  },

  /**
   * Live Supabase: Sign in with email and password.
   */
  async loginWithSupabase(email: string, password: string): Promise<Result<UserProfile>> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return {
        data: null,
        error: { code: "UNAUTHENTICATED", message: error?.message || "Login failed" },
      };
    }

    const profile = await this.getLiveProfile(data.user.id);
    if (!profile) {
      // Fallback profile if record is still provisioning
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
    }

    return { data: profile, error: null };
  },

  /**
   * Live Supabase: Sign out.
   */
  async logoutSupabase(): Promise<void> {
    await supabase.auth.signOut();
  },
};

