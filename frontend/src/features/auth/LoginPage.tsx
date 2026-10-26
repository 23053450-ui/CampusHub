/**
 * @file LoginPage.tsx
 * @description Clean, official Supabase authentication page using @supabase/auth-ui-react.
 * @owner Platform Core Team
 */

import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SupabaseAuth } from "./components/SupabaseAuth";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();

  const destination = (location.state as any)?.from?.pathname || "/";

  // Redirect to destination once authenticated
  useEffect(() => {
    if (user && !isLoading) {
      navigate(destination, { replace: true });
    }
  }, [user, isLoading, navigate, destination]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* App Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            CampusHub
          </h1>
          <p className="text-xs text-muted-foreground">
            Sign in to access your subjects, notes, and campus communities
          </p>
        </div>

        {/* Clean Card containing the official Supabase Auth UI */}
        <Card className="border shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Welcome</CardTitle>
            <CardDescription className="text-xs">
              Sign in with your email or university credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupabaseAuth />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
