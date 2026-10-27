/**
 * @file LoginForm.tsx
 * @description Modern shadcn/ui login & registration form block supporting custom unique handles
 *              and username-based authentication integrated with Supabase and offline mock mode.
 * @owner Platform Core Team
 */

import React, { useState, useEffect } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authService } from "../services/authService";
import { useDebounce } from "@/lib/use-debounce";
import type { UserProfile } from "@/shared/user";
import { toast } from "sonner";

interface LoginFormProps {
  isMock: boolean;
  onSuccess: (profile: UserProfile) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ isMock, onSuccess }) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Sign-in identifier (accepts either username or email)
  const [identifier, setIdentifier] = useState("");

  // Sign-up specific fields
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [handleStatus, setHandleStatus] = useState<{
    available: boolean | null;
    error?: string;
  }>({ available: null });

  // Debounced handle for real-time validation & availability check
  const debouncedHandle = useDebounce(handle.trim(), 350);

  useEffect(() => {
    let isCancelled = false;

    async function evaluateHandle() {
      if (mode !== "signup" || !debouncedHandle) {
        setHandleStatus({ available: null });
        setIsCheckingHandle(false);
        return;
      }

      const validation = authService.validateHandle(debouncedHandle);
      if (!validation.valid) {
        setHandleStatus({ available: false, error: validation.error });
        setIsCheckingHandle(false);
        return;
      }

      setIsCheckingHandle(true);
      const res = await authService.checkHandleAvailability(debouncedHandle, isMock);

      if (!isCancelled) {
        setIsCheckingHandle(false);
        setHandleStatus({
          available: res.available,
          error: res.error,
        });
      }
    }

    evaluateHandle();

    return () => {
      isCancelled = true;
    };
  }, [debouncedHandle, mode, isMock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "signin") {
      if (!identifier.trim() || !password) {
        toast.error("Please enter your username (or email) and password.");
        return;
      }

      setIsLoading(true);
      const res = await authService.login(identifier, password, isMock);
      setIsLoading(false);

      if (res.error) {
        toast.error(res.error.message);
        return;
      }

      if (res.data) {
        toast.success(`Welcome back, ${res.data.fullName || res.data.handle}!`);
        onSuccess(res.data);
      }
    } else {
      // Sign-up validation
      if (!handle.trim()) {
        toast.error("Please choose a username.");
        return;
      }
      if (!fullName.trim()) {
        toast.error("Please enter your full name.");
        return;
      }
      if (!email.trim()) {
        toast.error("Please enter your email.");
        return;
      }
      if (!password || password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }

      if (handleStatus.available === false) {
        toast.error(handleStatus.error || "Please choose a valid and available username.");
        return;
      }

      setIsLoading(true);
      const res = await authService.signUp(email, password, fullName, handle, isMock);
      setIsLoading(false);

      if (res.error) {
        toast.error(res.error.message);
        return;
      }

      if (res.data) {
        toast.success(`Account @${res.data.handle} created successfully!`);
        onSuccess(res.data);
      }
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          {mode === "signin" ? "Login to your account" : "Create an account"}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {mode === "signin"
            ? "Enter your username or email and password below"
            : "Choose a unique username and register for CampusHub"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" ? (
            <>
              {/* Unique Username / Handle Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="handle">Username</Label>
                  {isCheckingHandle && (
                    <span className="flex items-center text-[11px] text-muted-foreground">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Checking...
                    </span>
                  )}
                  {!isCheckingHandle && handleStatus.available === true && debouncedHandle && (
                    <span className="flex items-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Available
                    </span>
                  )}
                  {!isCheckingHandle && handleStatus.available === false && (
                    <span className="flex items-center text-[11px] font-medium text-destructive">
                      <AlertCircle className="mr-1 h-3.5 w-3.5" />
                      {handleStatus.error || "Unavailable"}
                    </span>
                  )}
                </div>

                <Input
                  id="handle"
                  type="text"
                  placeholder="unique_username"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
                <p className="text-[11px] text-muted-foreground">
                  4–20 characters. Letters, numbers, and underscores only.
                </p>
              </div>

              {/* Full Name Field */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">University Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </>
          ) : (
            /* Sign In: Identifier Field (Username or Email) */
            <div className="space-y-2">
              <Label htmlFor="identifier">Username or Email</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="username or email"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {mode === "signin" && (
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Password reset instructions will be sent to your account's email.");
                  }}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  Forgot password?
                </a>
              )}
            </div>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full font-medium cursor-pointer"
            disabled={isLoading || (mode === "signup" && isCheckingHandle)}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading
              ? mode === "signin"
                ? "Signing in..."
                : "Creating account..."
              : mode === "signin"
              ? "Sign In"
              : "Sign Up"}
          </Button>
        </form>

        <div className="mt-4 text-center text-xs">
          <span className="text-muted-foreground">
            {mode === "signin"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setHandleStatus({ available: null });
            }}
            className="font-medium text-primary hover:underline underline-offset-4 cursor-pointer"
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
