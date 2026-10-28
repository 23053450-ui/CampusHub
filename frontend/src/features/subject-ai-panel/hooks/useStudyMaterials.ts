import { useCallback, useEffect, useState } from "react";
import {
  deleteStudyMaterial,
  listStudyMaterials,
  StudyMaterialApiError,
  uploadStudyMaterial,
  type UploadedStudyMaterial,
} from "../services/studyMaterials";

export const MAX_STUDY_MATERIALS = 5;
export const MAX_STUDY_MATERIAL_BYTES = 20 * 1024 * 1024;

export type StudyMaterial = UploadedStudyMaterial & {
  selected: boolean;
};

function errorMessage(error: unknown): string {
  if (error instanceof StudyMaterialApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Could not handle this study material. Please try again.";
}

function supportsFile(file: File): boolean {
  return /\.(pdf|txt|md)$/i.test(file.name);
}

export function useStudyMaterials(subjectId: string) {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMaterials([]);
    setError(null);

    if (!subjectId) {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    void listStudyMaterials(subjectId)
      .then((items) => {
        if (!cancelled) setMaterials(items.map((item) => ({ ...item, selected: true })));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!subjectId || uploadingFile) return;
      setError(null);
      let current = materials;
      const errors: string[] = [];

      for (const file of files) {
        if (current.length >= MAX_STUDY_MATERIALS) {
          errors.push(`You can attach up to ${MAX_STUDY_MATERIALS} files to one subject.`);
          break;
        }
        if (!supportsFile(file)) {
          errors.push(`${file.name}: choose a PDF, TXT or MD file.`);
          continue;
        }
        if (file.size > MAX_STUDY_MATERIAL_BYTES) {
          errors.push(`${file.name}: the maximum file size is 20 MB.`);
          continue;
        }
        if (file.size === 0) {
          errors.push(`${file.name}: the file is empty.`);
          continue;
        }

        setUploadingFile(file.name);
        try {
          const uploaded = await uploadStudyMaterial(subjectId, file);
          const next: StudyMaterial = { ...uploaded, selected: true };
          current = [...current, next];
          setMaterials(current);
        } catch (err) {
          errors.push(`${file.name}: ${errorMessage(err)}`);
        } finally {
          setUploadingFile(null);
        }
      }

      if (errors.length) setError(errors.join(" "));
    },
    [materials, subjectId, uploadingFile],
  );

  const removeMaterial = useCallback(
    async (materialId: string) => {
      if (!subjectId || removingId) return;
      setRemovingId(materialId);
      setError(null);
      try {
        await deleteStudyMaterial(subjectId, materialId);
        setMaterials((prev) => prev.filter((item) => item.id !== materialId));
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setRemovingId(null);
      }
    },
    [removingId, subjectId],
  );

  const toggleMaterial = useCallback((materialId: string) => {
    setMaterials((prev) =>
      prev.map((item) =>
        item.id === materialId ? { ...item, selected: !item.selected } : item,
      ),
    );
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    materials,
    selectedMaterialIds: materials.filter((item) => item.selected).map((item) => item.id),
    isLoading,
    uploadingFile,
    isUploading: uploadingFile !== null,
    removingId,
    error,
    addFiles,
    removeMaterial,
    toggleMaterial,
    clearError,
  };
}
