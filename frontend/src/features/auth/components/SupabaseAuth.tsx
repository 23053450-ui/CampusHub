/**
 * @file SupabaseAuth.tsx
 * @description Official Supabase pre-built Auth component with ThemeSupa styling.
 * @owner Platform Core Team
 */

import React from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";

export const SupabaseAuth: React.FC = () => {
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
            button: "font-medium shadow-xs text-sm h-9",
            input: "text-sm h-9",
            label: "text-xs font-semibold text-foreground",
            anchor: "text-xs text-muted-foreground hover:text-foreground underline-offset-4",
            divider: "bg-border",
            message: "text-xs text-destructive",
          },
        }}
        providers={["github", "google"]}
      />
    </div>
  );
};
