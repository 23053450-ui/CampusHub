/**
 * @file avatar-pipeline.ts
 * @description Client-side 500x500 center-crop and adaptive WebP compression under 50 KB.
 * @owner Platform Core Team
 */

export interface ProcessedAvatarResult {
  file: File;
  previewUrl: string;
  sizeBytes: number;
  sizeKb: string;
  originalSizeBytes: number;
  originalSizeKb: string;
  qualityUsed: number;
}

const TARGET_DIMENSION = 500;
const MAX_ALLOWED_BYTES = 51200; // 50 KB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Center-crops any image to a 1:1 square, scales it to 500x500 px,
 * and adaptively compresses it to WebP ensuring the size is strictly under 50 KB.
 */
export async function processAvatarImage(file: File): Promise<ProcessedAvatarResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`File "${file.name}" is not a supported image.`);
  }

  // 1. Load image into memory
  const objectUrl = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Failed to load selected image."));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  // 2. Calculate center square crop coordinates
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;
  const cropSize = Math.min(naturalWidth, naturalHeight);
  const sx = Math.floor((naturalWidth - cropSize) / 2);
  const sy = Math.floor((naturalHeight - cropSize) / 2);

  // 3. Render 500x500 canvas
  const canvas = document.createElement("canvas");
  canvas.width = TARGET_DIMENSION;
  canvas.height = TARGET_DIMENSION;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create canvas context for image processing.");
  }

  // Enable high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw center-cropped square resized to 500x500
  ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, TARGET_DIMENSION, TARGET_DIMENSION);

  const toWebpBlob = (quality: number): Promise<Blob> =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to generate WebP image blob."));
        },
        "image/webp",
        quality
      );
    });

  // 4. Adaptive compression: start at 0.88, step down if > 50 KB
  let quality = 0.88;
  let blob = await toWebpBlob(quality);

  while (blob.size > MAX_ALLOWED_BYTES && quality > 0.50) {
    quality = Math.max(0.50, parseFloat((quality - 0.06).toFixed(2)));
    blob = await toWebpBlob(quality);
  }

  if (blob.size > MAX_ALLOWED_BYTES) {
    throw new Error(`Image is too complex to fit within the 50 KB limit (${formatBytes(blob.size)}). Please try another image.`);
  }

  // 5. Generate outputs
  const previewUrl = canvas.toDataURL("image/webp", quality);
  const processedFile = new File([blob], "avatar.webp", { type: "image/webp" });

  return {
    file: processedFile,
    previewUrl,
    sizeBytes: blob.size,
    sizeKb: formatBytes(blob.size),
    originalSizeBytes: file.size,
    originalSizeKb: formatBytes(file.size),
    qualityUsed: quality,
  };
}

