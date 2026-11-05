/**
 * @file SubjectEnrollmentDialog.tsx
 * @description Dialog allowing students to manage their enrolled subjects anytime with safety guarantees.
 * @owner Platform Core Team
 */

import React, { useEffect, useMemo, useState } from "react";
import { Search, Check, BookOpen, ShieldCheck, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUserSubjects } from "@/lib/user-subjects-context";

export function SubjectEnrollmentDialog() {
  const {
    allSubjects,
    enrolledSubjects,
    isModalOpen,
    closeModal,
    saveEnrollments,
  } = useUserSubjects();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state whenever the modal opens or enrolledSubjects change
  useEffect(() => {
    if (isModalOpen) {
      setSelectedIds(enrolledSubjects.map((s) => s.id));
      setSearchQuery("");
      setIsSaving(false);
    }
  }, [isModalOpen, enrolledSubjects]);

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allSubjects;
    return allSubjects.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [allSubjects, searchQuery]);

  const toggleSubject = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(allSubjects.map((s) => s.id));
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await saveEnrollments(selectedIds);
    setIsSaving(false);
    if (!error) {
      closeModal();
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Manage Enrolled Subjects
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Select the subjects you are taking this semester to customize your dashboard and sidebar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
          {/* Reassurance Alert */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-200/80 bg-blue-50/60 p-3 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div className="leading-relaxed">
              <span className="font-semibold">Your personal files are always safe:</span>{" "}
              Unenrolling a subject removes it from your active dashboard and sidebar. Any personal notes, uploaded files, and study history remain securely saved.
            </div>
          </div>

          {/* Search Bar & Quick Toggles */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code (e.g. CS301) or name..."
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 text-xs">
              <button
                type="button"
                onClick={selectAll}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                Select all
              </button>
              <span className="text-muted-foreground">•</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-muted-foreground hover:text-foreground font-medium cursor-pointer"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {filteredSubjects.length === 0 ? (
              <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                No subjects matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredSubjects.map((subject) => {
                const isSelected = selectedIds.includes(subject.id);

                return (
                  <div
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    className={`group relative flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "border-primary/60 bg-primary/5 shadow-xs"
                        : "border-border/70 hover:border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`font-mono text-[11px] font-semibold ${
                            isSelected
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {subject.code}
                        </Badge>
                      </div>
                      <p
                        className={`text-xs font-medium line-clamp-1 transition-colors ${
                          isSelected ? "text-foreground font-semibold" : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        {subject.name}
                      </p>
                    </div>

                    {/* Custom Checkbox circle */}
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-muted-foreground/30 bg-background group-hover:border-muted-foreground/60"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3.5 border-t border-border/70 flex flex-row items-center justify-between sm:justify-between bg-muted/20">
          <div className="text-xs text-muted-foreground font-medium">
            <span className="font-semibold text-foreground">{selectedIds.length}</span> of {allSubjects.length} enrolled
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeModal}
              disabled={isSaving}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1.5 cursor-pointer"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

