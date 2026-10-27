/**
 * @file LoginPage.tsx
 * @description Authentication page utilizing the shadcn/ui Login block.
 * @owner Platform Core Team
 */

import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { LoginForm } from "./components/LoginForm";
import { useAuth } from "@/lib/auth-context";
import type { UserProfile } from "@/shared/user";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, isMock, setAuthUser } = useAuth();

  const destination = (location.state as any)?.from?.pathname || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      navigate(destination, { replace: true });
    }
  }, [user, isLoading, navigate, destination]);

  const handleSuccess = (profile: UserProfile) => {
    setAuthUser(profile);
    navigate(destination, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* CampusHub Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            CampusHub
          </h1>
          <p className="text-xs text-muted-foreground">
            Centralized campus learning, community, and academic companion
          </p>
        </div>

        {/* shadcn Login Block */}
        <LoginForm isMock={isMock} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
