/**
 * @file MockLoginForm.tsx
 * @description Interactive mock login form with quick role presets for offline development.
 * @owner Platform Core Team
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { authService } from "../services/authService";
import { MOCK_ACCOUNTS } from "../services/mockAccounts";
import type { UserProfile } from "@/shared/user";
import { GraduationCap, ShieldAlert, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface MockLoginFormProps {
  onSuccess: (user: UserProfile) => void;
}

export const MockLoginForm: React.FC<MockLoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState("student@campushub.edu");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = authService.loginMock(email, password);
    setIsLoading(false);

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    if (result.data) {
      toast.success(`Signed in as ${result.data.fullName} (${result.data.role})`);
      onSuccess(result.data);
    }
  };

  const handleRoleQuickSelect = (roleKey: "student" | "moderator" | "admin") => {
    const acc = MOCK_ACCOUNTS[roleKey];
    setEmail(acc.email);
    setPassword(acc.password);
    const result = authService.loginMock(roleKey);
    if (result.data) {
      toast.success(`Signed in as ${result.data.fullName} (${result.data.role})`);
      onSuccess(result.data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Role Selection Presets */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          1-Click Mock Role Presets
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex flex-col items-center justify-center h-auto py-2.5 px-2 hover:border-primary cursor-pointer text-center"
            onClick={() => handleRoleQuickSelect("student")}
          >
            <GraduationCap className="h-4 w-4 mb-1 text-primary" />
            <span className="text-xs font-semibold">Student</span>
            <span className="text-[10px] text-muted-foreground truncate max-w-full">Alex Chen</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="flex flex-col items-center justify-center h-auto py-2.5 px-2 hover:border-primary cursor-pointer text-center"
            onClick={() => handleRoleQuickSelect("moderator")}
          >
            <ShieldCheck className="h-4 w-4 mb-1 text-blue-500" />
            <span className="text-xs font-semibold">Moderator</span>
            <span className="text-[10px] text-muted-foreground truncate max-w-full">Morgan T.</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="flex flex-col items-center justify-center h-auto py-2.5 px-2 hover:border-primary cursor-pointer text-center"
            onClick={() => handleRoleQuickSelect("admin")}
          >
            <ShieldAlert className="h-4 w-4 mb-1 text-amber-500" />
            <span className="text-xs font-semibold">Admin</span>
            <span className="text-[10px] text-muted-foreground truncate max-w-full">Dr. Vance</span>
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or sign in with mock email</span>
        </div>
      </div>

      {/* Manual Email / Password Form */}
      <form onSubmit={handleCustomLogin} className="space-y-3.5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@campushub.edu"
            required
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">Password</label>
            <span className="text-[10px] text-muted-foreground font-mono">password123</span>
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password123"
            required
            className="h-9 text-sm"
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full h-9 mt-1 cursor-pointer">
          {isLoading ? "Signing in..." : "Sign In to Mock Account"}
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </form>

      {/* Helper Account Preview */}
      <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">Working Test Accounts:</span>
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
            Offline Mock
          </Badge>
        </div>
        <ul className="space-y-1 text-muted-foreground text-[11px] font-mono">
          <li>• student@campushub.edu (Alex Chen)</li>
          <li>• moderator@campushub.edu (Morgan Taylor)</li>
          <li>• admin@campushub.edu (Dr. Sarah Vance)</li>
          <li className="text-[10px] text-muted-foreground pt-0.5">Password for all: <code className="bg-muted px-1 py-0.5 rounded">password123</code></li>
        </ul>
      </div>
    </div>
  );
};

