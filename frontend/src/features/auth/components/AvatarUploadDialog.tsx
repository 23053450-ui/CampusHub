/**
 * @file AvatarUploadDialog.tsx
 * @description Dialog allowing users to upload and compress their profile picture to 500x500 WebP under 50 KB.
 * @owner Platform Core Team
 */

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { processAvatarImage, type ProcessedAvatarResult } from "@/lib/avatar-pipeline";
import { avatarService } from "../services/avatarService";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AvatarUploadDialog: React.FC<AvatarUploadDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { user, isMock, updateUserAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [processed, setProcessed] = useState<ProcessedAvatarResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const result = await processAvatarImage(file);
      setProcessed(result);
      toast.success(`Image compressed to ${result.sizeKb} (500×500)`);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to process image.");
      setProcessed(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!user || !processed) return;

    setIsUploading(true);
    const res = await avatarService.uploadAvatar(
      user.id,
      processed.file,
      processed.previewUrl,
      isMock
    );
    setIsUploading(false);

    if (res.error) {
      toast.error(res.error.message);
      return;
    }

    if (res.data) {
      updateUserAvatar(res.data);
      toast.success("Profile picture updated!");
      onOpenChange(false);
      setProcessed(null);
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setProcessed(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Change Profile Picture</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Image will be center-cropped to 500×500 px and compressed under 50 KB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Avatar Preview Comparison */}
          <div className="flex items-center justify-center gap-6 py-2">
            <div className="flex flex-col items-center gap-1.5">
              <Avatar className="h-16 w-16 border-2">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName || "User"} />}
                <AvatarFallback className="text-base font-semibold">
                  {user?.fullName?.slice(0, 2).toUpperCase() || "ST"}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] text-muted-foreground font-medium">Current</span>
            </div>

            {processed && (
              <>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />

                <div className="flex flex-col items-center gap-1.5">
                  <Avatar className="h-16 w-16 border-2 border-primary ring-2 ring-primary/20">
                    <AvatarImage src={processed.previewUrl} alt="New Preview" />
                    <AvatarFallback>PREV</AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] text-primary font-semibold">500×500 WebP</span>
                </div>
              </>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* Upload Drop Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/60 hover:bg-muted/40 transition-colors text-center"
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-xs font-medium">Cropping & compressing to 500×500 WebP...</p>
              </div>
            ) : (
              <>
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Click to browse or choose an image
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    PNG, JPG, or WebP. Automatically resized and capped under 50 KB.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Compression Stats Badge */}
          {processed && (
            <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Compression Successful
                </span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  &lt; 50 KB Limit Met
                </Badge>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Original: {processed.originalSizeKb}</span>
                <span className="font-semibold text-foreground">
                  Compressed: {processed.sizeKb} ({(processed.qualityUsed * 100).toFixed(0)}% quality)
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleClose(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!processed || isUploading || isProcessing}
            className="cursor-pointer"
          >
            {isUploading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {isUploading ? "Uploading..." : "Save Avatar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

