/**
 * @file LoginPage.tsx
 * @description Authentication page providing Supabase Auth UI and offline Mock mode login.
 * @owner Platform Core Team
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SupabaseAuthForm } from "./components/SupabaseAuthForm";
import { MockLoginForm } from "./components/MockLoginForm";
import { useAuth } from "@/lib/auth-context";
import type { UserProfile } from "@/shared/user";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, setMockUser } = useAuth();

  const isMockDefault = import.meta.env.VITE_USE_MOCKS === "true";
  const [activeTab, setActiveTab] = useState<"mock" | "supabase">(
    isMockDefault ? "mock" : "supabase"
  );

  const destination = (location.state as any)?.from?.pathname || "/";

  useEffect(() => {
    if (user && !isLoading) {
      navigate(destination, { replace: true });
    }
  }, [user, isLoading, navigate, destination]);

  const handleLoginSuccess = (profile: UserProfile) => {
    setMockUser(profile);
    navigate(destination, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 md:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome to CampusHub
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            Your centralized campus learning, community, and academic companion
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {activeTab === "mock" ? "Mock Authentication" : "Supabase Sign In"}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {activeTab === "mock"
                    ? "Select a role or sign in with test credentials"
                    : "Authenticate with your Supabase account or OAuth"}
                </CardDescription>
              </div>

              <Badge
                variant={activeTab === "mock" ? "secondary" : "default"}
                className="text-[10px] uppercase font-mono"
              >
                {activeTab === "mock" ? "Mock Mode" : "Supabase"}
              </Badge>
            </div>

            {/* Mode Switcher Pill */}
            <div className="flex rounded-lg bg-muted p-1 mt-3">
              <Button
                type="button"
                variant={activeTab === "mock" ? "default" : "ghost"}
                size="sm"
                className="flex-1 text-xs h-7 cursor-pointer"
                onClick={() => setActiveTab("mock")}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Mock Dev Login
              </Button>
              <Button
                type="button"
                variant={activeTab === "supabase" ? "default" : "ghost"}
                size="sm"
                className="flex-1 text-xs h-7 cursor-pointer"
                onClick={() => setActiveTab("supabase")}
              >
                Supabase Auth UI
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            {activeTab === "mock" ? (
              <MockLoginForm onSuccess={handleLoginSuccess} />
            ) : (
              <SupabaseAuthForm />
            )}
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-xs text-muted-foreground">
          Tip: Set <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono">VITE_MOCK_ROLE=student</code> in{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono">.env.local</code> to auto-skip this screen.
        </p>
      </div>
    </div>
  );
}
