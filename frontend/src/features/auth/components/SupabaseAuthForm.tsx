/**
 * @file SupabaseAuthForm.tsx
 * @description Official Supabase Auth UI integration styled with CampusHub theme tokens.
 * @owner Platform Core Team
 */

import React from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";

export const SupabaseAuthForm: React.FC = () => {
  return (
    <div className="w-full">
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: "hsl(var(--primary))",
                brandAccent: "hsl(var(--primary))",
                brandButtonText: "hsl(var(--primary-foreground))",
                defaultButtonBackground: "hsl(var(--secondary))",
                defaultButtonBackgroundHover: "hsl(var(--secondary)/80)",
                defaultButtonBorder: "hsl(var(--border))",
                defaultButtonText: "hsl(var(--secondary-foreground))",
                inputBackground: "hsl(var(--background))",
                inputBorder: "hsl(var(--input))",
                inputBorderHover: "hsl(var(--ring))",
                inputBorderFocus: "hsl(var(--ring))",
                inputText: "hsl(var(--foreground))",
                inputPlaceholder: "hsl(var(--muted-foreground))",
              },
              radii: {
                borderRadiusButton: "0.5rem",
                buttonBorderRadius: "0.5rem",
                inputBorderRadius: "0.5rem",
              },
            },
          },
          className: {
            container: "flex flex-col gap-3",
            button: "font-medium transition-colors shadow-xs text-sm",
            input: "text-sm",
            label: "text-xs font-semibold text-foreground",
            anchor: "text-xs text-primary hover:underline",
            divider: "bg-border",
            message: "text-xs text-destructive",
          },
        }}
        providers={["github", "google"]}
      />
    </div>
  );
};

