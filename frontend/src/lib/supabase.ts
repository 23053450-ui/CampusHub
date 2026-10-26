/**
 * @file supabase.ts
 * @description Supabase client singleton with mock auth transport for offline development.
 * @owner Platform Core Team
 */

import { createClient } from "@supabase/supabase-js";
import { MOCK_ACCOUNTS } from "@/features/auth/services/mockAccounts";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";
const isMock = import.meta.env.VITE_USE_MOCKS === "true";

/**
 * Intercepts auth requests in offline mock mode so @supabase/auth-ui-react
 * works seamlessly without needing a live network connection.
 */
const mockFetch: typeof fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

  if (isMock && (url.includes("placeholder.supabase.co") || url.includes("/auth/v1/"))) {
    // 1. Handle Sign In (password token)
    if (url.includes("/token?grant_type=password") || (url.includes("/token") && init?.method === "POST")) {
      let body: any = {};
      try {
        body = JSON.parse((init?.body as string) || "{}");
      } catch {
        // Ignore
      }

      const email = (body.email || "student@campushub.edu").toLowerCase();
      const match = Object.values(MOCK_ACCOUNTS).find((acc) => acc.email.toLowerCase() === email);

      const profile = match
        ? match.profile
        : {
            id: `mock-${email.split("@")[0]}-uuid`,
            handle: email.split("@")[0],
            fullName: email.split("@")[0].replace(/\b\w/g, (c: string) => c.toUpperCase()),
            avatarUrl: null,
            role: "student" as const,
            createdAt: new Date().toISOString(),
          };

      const mockResponse = {
        access_token: `mock-token-${profile.role}-${profile.id}`,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock-refresh-token",
        user: {
          id: profile.id,
          aud: "authenticated",
          role: "authenticated",
          email,
          email_confirmed_at: new Date().toISOString(),
          user_metadata: {
            full_name: profile.fullName,
            handle: profile.handle,
            avatar_url: profile.avatarUrl,
            role: profile.role,
          },
          app_metadata: {
            provider: "email",
          },
          created_at: profile.createdAt,
          updated_at: new Date().toISOString(),
        },
      };

      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Handle Sign Up
    if (url.includes("/signup") && init?.method === "POST") {
      let body: any = {};
      try {
        body = JSON.parse((init?.body as string) || "{}");
      } catch {
        // Ignore
      }

      const email = (body.email || "newstudent@campushub.edu").toLowerCase();
      const handle = email.split("@")[0];
      const fullName = body.data?.full_name || handle;

      const mockResponse = {
        id: `mock-${handle}-uuid`,
        aud: "authenticated",
        role: "authenticated",
        email,
        email_confirmed_at: new Date().toISOString(),
        user_metadata: {
          full_name: fullName,
          handle,
          role: "student",
        },
        app_metadata: {
          provider: "email",
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Handle Logout / User Info / Others
    if (url.includes("/logout")) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return fetch(input, init);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: isMock ? mockFetch : fetch,
  },
});
