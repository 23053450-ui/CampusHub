/**
 * @file image-viewer-context.tsx
 * @description Global context and provider for the full-window image viewer lightbox.
 * @owner Platform Core Team
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { ImageViewerModal } from "@/components/ui/image-viewer";

export interface ImageViewerOptions {
  images: string[];
  initialIndex?: number;
  title?: string;
}

interface ImageViewerContextType {
  isOpen: boolean;
  images: string[];
  currentIndex: number;
  title?: string;
  openImageViewer: (options: ImageViewerOptions) => void;
  closeImageViewer: () => void;
  setCurrentIndex: (index: number) => void;
}

const ImageViewerContext = createContext<ImageViewerContextType | undefined>(undefined);

export function ImageViewerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [title, setTitle] = useState<string | undefined>(undefined);

  const openImageViewer = useCallback(
    ({ images: imgList, initialIndex = 0, title: imgTitle }: ImageViewerOptions) => {
      const validImages = (imgList || []).filter((img) => Boolean(img && img.trim()));
      if (validImages.length === 0) return;

      const safeIndex = Math.max(0, Math.min(initialIndex, validImages.length - 1));
      setImages(validImages);
      setCurrentIndex(safeIndex);
      setTitle(imgTitle);
      setIsOpen(true);
    },
    []
  );

  const closeImageViewer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      images,
      currentIndex,
      title,
      openImageViewer,
      closeImageViewer,
      setCurrentIndex,
    }),
    [isOpen, images, currentIndex, title, openImageViewer, closeImageViewer]
  );

  return (
    <ImageViewerContext.Provider value={value}>
      {children}
      <ImageViewerModal
        isOpen={isOpen}
        images={images}
        currentIndex={currentIndex}
        title={title}
        onClose={closeImageViewer}
        onIndexChange={setCurrentIndex}
      />
    </ImageViewerContext.Provider>
  );
}

export function useImageViewer() {
  const context = useContext(ImageViewerContext);
  if (!context) {
    throw new Error("useImageViewer must be used within an ImageViewerProvider");
  }
  return context;
}
