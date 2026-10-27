/**
 * @file imagePipeline.ts
 * @description Client-side image optimization pipeline: resolution bounding, WebP conversion, and 1MB ceiling enforcement.
 * @owner Communities Team
 */

export interface ProcessedImageResult {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  originalName: string;
}

export interface ImageProcessingOptions {
  maxDimension?: number;
  maxSizeBytes?: number;
  initialQuality?: number;
}

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_MAX_SIZE_BYTES = 1024 * 1024; // 1 MB
const DEFAULT_INITIAL_QUALITY = 0.85;

/**
 * Resizes an image preserving aspect ratio (max dimension 1600px without upscaling),
 * converts to WebP format, and verifies that the compressed output does not exceed 1 MB.
 * Throws an error if the compressed result still exceeds 1 MB.
 */
export async function processCommunityImage(
  file: File,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImageResult> {
  const maxDim = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const maxBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
  const initialQuality = options.initialQuality ?? DEFAULT_INITIAL_QUALITY;

  if (!file.type.startsWith("image/")) {
    throw new Error(`File "${file.name}" is not a supported image.`);
  }

  // Load image into an HTMLImageElement
  const objectUrl = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image "${file.name}".`));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  let { width, height } = img;

  // Proportional resize preserving aspect ratio (do not upscale smaller images)
  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  // Render onto canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create canvas rendering context for image processing.");
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Helper to convert canvas to WebP Blob
  const toWebpBlob = (quality: number): Promise<Blob> =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas to WebP blob conversion failed."));
          }
        },
        "image/webp",
        quality
      );
    });

  // First pass: standard high quality
  let blob = await toWebpBlob(initialQuality);

  // Second pass: if slightly above 1MB, attempt secondary compression pass at 0.70 quality
  if (blob.size > maxBytes && initialQuality > 0.70) {
    const secondaryBlob = await toWebpBlob(0.70);
    if (secondaryBlob.size <= maxBytes) {
      blob = secondaryBlob;
    }
  }

  // Strict 1MB limitation check
  if (blob.size > maxBytes) {
    const sizeMb = (blob.size / (1024 * 1024)).toFixed(2);
    throw new Error(
      `Image "${file.name}" exceeds the 1 MB limit after WebP compression (${sizeMb} MB). Please choose a smaller image.`
    );
  }

  // Generate clean filename with .webp extension
  const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
  const webpFileName = `${baseName}.webp`;

  const webpFile = new File([blob], webpFileName, {
    type: "image/webp",
    lastModified: Date.now(),
  });

  // Generate data URL for instant client-side preview
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read processed image data URL."));
    reader.readAsDataURL(blob);
  });

  return {
    file: webpFile,
    dataUrl,
    width,
    height,
    sizeBytes: blob.size,
    originalName: file.name,
  };
}

