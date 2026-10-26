/**
 * @file avatarService.ts
 * @description Uploads compressed avatar images to Supabase Storage or updates mock session.
 * @owner Platform Core Team
 */

import { supabase } from "@/lib/supabase";
import type { Result } from "@/shared/result";
import type { UserProfile } from "@/shared/user";

const MOCK_STORAGE_KEY = "campushub:mock_session";

export const avatarService = {
  /**
   * Uploads the compressed 500x500 WebP avatar.
   */
  async uploadAvatar(
    userId: string,
    file: File,
    dataUrl: string,
    isMock: boolean
  ): Promise<Result<string>> {
    if (isMock) {
      // In Mock Mode, save Data URL directly to session
      try {
        const cached = localStorage.getItem(MOCK_STORAGE_KEY);
        if (cached) {
          const profile = JSON.parse(cached) as UserProfile;
          profile.avatarUrl = dataUrl;
          localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(profile));
        }
        return { data: dataUrl, error: null };
      } catch (err: unknown) {
        return {
          data: null,
          error: { code: "INTERNAL", message: (err as Error).message || "Failed to update mock profile picture" },
        };
      }
    }

    // Live Supabase Storage upload
    try {
      const filePath = `${userId}/avatar.webp`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          contentType: "image/webp",
          cacheControl: "3600",
        });

      if (uploadError) {
        return {
          data: null,
          error: { code: "INTERNAL", message: uploadError.message },
        };
      }

      // Get public URL with timestamp cache-buster
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update public.profiles table
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (dbError) {
        return {
          data: null,
          error: { code: "INTERNAL", message: dbError.message },
        };
      }

      return { data: publicUrl, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: { code: "NETWORK", message: (err as Error).message || "Network error uploading avatar" },
      };
    }
  },
};
