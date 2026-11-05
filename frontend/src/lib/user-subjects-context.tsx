/**
 * @file user-subjects-context.tsx
 * @description Global context providing reactive access to curriculum subjects and user enrollments.
 * @owner Platform Core Team
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Subject } from "@/shared/user";
import { subjects as fallbackSubjects } from "@/shared/subjects";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface UserSubjectsContextType {
  enrolledSubjects: Subject[];
  allSubjects: Subject[];
  isLoading: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  saveEnrollments: (selectedIds: string[]) => Promise<{ error: Error | null }>;
  refresh: () => Promise<void>;
}

const UserSubjectsContext = createContext<UserSubjectsContextType | undefined>(undefined);

const MOCK_STORAGE_KEY = "campushub:mock:enrolled_subjects";

export const UserSubjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isMock } = useAuth();
  const [enrolledSubjects, setEnrolledSubjects] = useState<Subject[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Load all curriculum subjects
      let catalog: Subject[] = [...fallbackSubjects];
      if (!isMock) {
        const { data: catalogRows, error: catalogErr } = await supabase
          .from("subjects")
          .select("id, name, code")
          .order("name", { ascending: true });

        if (!catalogErr && catalogRows && catalogRows.length > 0) {
          catalog = catalogRows.map((r: any) => ({
            id: r.id,
            name: r.name,
            code: r.code,
          }));
        }
      }
      setAllSubjects(catalog);

      // 2. Load user's enrolled subjects
      if (isMock) {
        try {
          const raw = localStorage.getItem(MOCK_STORAGE_KEY);
          const enrolledIds: string[] = raw ? JSON.parse(raw) : [];
          const enrolled = catalog.filter((s) => enrolledIds.includes(s.id));
          setEnrolledSubjects(enrolled);
        } catch {
          setEnrolledSubjects([]);
        }
      } else {
        if (!user?.id) {
          setEnrolledSubjects([]);
        } else {
          const { data: enrollRows, error: enrollErr } = await supabase
            .from("user_subjects")
            .select("subject_id, subjects(id, name, code)")
            .eq("user_id", user.id);

          if (enrollErr || !enrollRows) {
            setEnrolledSubjects([]);
          } else {
            const enrolled: Subject[] = enrollRows
              .map((row: any) => row.subjects)
              .filter(Boolean)
              .map((s: any) => ({
                id: s.id,
                name: s.name,
                code: s.code,
              }));
            setEnrolledSubjects(enrolled);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load user subjects:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isMock, user?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const saveEnrollments = useCallback(
    async (selectedIds: string[]): Promise<{ error: Error | null }> => {
      try {
        if (isMock) {
          localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(selectedIds));
          const enrolled = allSubjects.filter((s) => selectedIds.includes(s.id));
          setEnrolledSubjects(enrolled);
          toast.success("Enrolled subjects updated.");
          return { error: null };
        }

        if (!user?.id) {
          const err = new Error("You must be logged in to modify subjects.");
          toast.error(err.message);
          return { error: err };
        }

        // Fetch current enrollments
        const { data: currentRows, error: fetchErr } = await supabase
          .from("user_subjects")
          .select("subject_id")
          .eq("user_id", user.id);

        if (fetchErr) {
          toast.error(fetchErr.message);
          return { error: new Error(fetchErr.message) };
        }

        const currentIds = new Set((currentRows || []).map((r: any) => r.subject_id));
        const targetIds = new Set(selectedIds);

        const toAdd = selectedIds.filter((id) => !currentIds.has(id));
        const toRemove = Array.from(currentIds).filter((id) => !targetIds.has(id));

        // Delete unselected subjects (Safely removes enrollment only - leaves notes & storage intact)
        if (toRemove.length > 0) {
          const { error: deleteErr } = await supabase
            .from("user_subjects")
            .delete()
            .eq("user_id", user.id)
            .in("subject_id", toRemove);

          if (deleteErr) {
            toast.error(deleteErr.message);
            return { error: new Error(deleteErr.message) };
          }
        }

        // Insert newly selected subjects
        if (toAdd.length > 0) {
          const rowsToInsert = toAdd.map((id) => ({
            user_id: user.id,
            subject_id: id,
          }));
          const { error: insertErr } = await supabase
            .from("user_subjects")
            .insert(rowsToInsert);

          if (insertErr) {
            toast.error(insertErr.message);
            return { error: new Error(insertErr.message) };
          }
        }

        // Re-sync local enrolled subjects
        const enrolled = allSubjects.filter((s) => selectedIds.includes(s.id));
        setEnrolledSubjects(enrolled);
        toast.success("Enrolled subjects updated successfully.");
        return { error: null };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to update enrollments");
        toast.error(error.message);
        return { error };
      }
    },
    [allSubjects, isMock, user?.id]
  );

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  return (
    <UserSubjectsContext.Provider
      value={{
        enrolledSubjects,
        allSubjects,
        isLoading,
        isModalOpen,
        openModal,
        closeModal,
        saveEnrollments,
        refresh: loadData,
      }}
    >
      {children}
    </UserSubjectsContext.Provider>
  );
};

export function useUserSubjects() {
  const context = useContext(UserSubjectsContext);
  if (!context) {
    throw new Error("useUserSubjects must be used within a UserSubjectsProvider");
  }
  return context;
}

