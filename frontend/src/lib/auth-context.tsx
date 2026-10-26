/**
 * @file auth-context.tsx
 * @description Central authentication provider managing user session, roles, and mock bypass.
 * @owner Platform Core Team
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import type { UserProfile } from "@/shared/user";
import { authService } from "@/features/auth/services/authService";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isMock: boolean;
  setMockUser: (profile: UserProfile | null) => void;
  loginMock: (roleOrEmail: string, password?: string) => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMock = import.meta.env.VITE_USE_MOCKS === "true";
  const mockRoleEnv = import.meta.env.VITE_MOCK_ROLE as string | undefined;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        if (isMock) {
          // 1. Check if VITE_MOCK_ROLE is specified in .env.local to skip login
          if (mockRoleEnv && mockRoleEnv.trim()) {
            const autoUser = authService.getAutoMockUser(mockRoleEnv.trim());
            if (autoUser && isMounted) {
              setUser(autoUser);
              setIsLoading(false);
              return;
            }
          }

          // 2. Otherwise check for an active cached mock session in localStorage
          const cached = authService.getCachedMockUser();
          if (cached && isMounted) {
            setUser(cached);
          }
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        // Live Supabase Mode
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const profile = await authService.getLiveProfile(session.user.id);
          if (profile && isMounted) {
            setUser(profile);
          } else if (isMounted) {
            setUser({
              id: session.user.id,
              handle: session.user.email?.split("@")[0] || "user",
              fullName: session.user.user_metadata?.full_name || null,
              avatarUrl: session.user.user_metadata?.avatar_url || null,
              role: "student",
              createdAt: session.user.created_at,
            });
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Listen to live Supabase auth state changes if not in mock mode
    if (!isMock) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!session?.user) {
            if (isMounted) setUser(null);
            return;
          }

          const profile = await authService.getLiveProfile(session.user.id);
          if (profile && isMounted) {
            setUser(profile);
          } else if (isMounted) {
            setUser({
              id: session.user.id,
              handle: session.user.email?.split("@")[0] || "user",
              fullName: session.user.user_metadata?.full_name || null,
              avatarUrl: session.user.user_metadata?.avatar_url || null,
              role: "student",
              createdAt: session.user.created_at,
            });
          }
        }
      );

      return () => {
        isMounted = false;
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [isMock, mockRoleEnv]);

  const setMockUser = (profile: UserProfile | null) => {
    setUser(profile);
  };

  const loginMock = (roleOrEmail: string, password?: string): boolean => {
    const res = authService.loginMock(roleOrEmail, password);
    if (res.data) {
      setUser(res.data);
      return true;
    }
    return false;
  };

  const logout = async () => {
    if (isMock) {
      authService.logoutMock();
      setUser(null);
    } else {
      await authService.logoutSupabase();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isMock,
        setMockUser,
        loginMock,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

