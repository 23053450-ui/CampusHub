import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen,
  LoaderCircle,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchSubjectResources,
  downloadResourceAsFile,
  type ResourceCategory,
  type SubjectResourceItem,
} from "../services/subjectResources";

const CATEGORIES: { key: ResourceCategory; label: string }[] = [
  { key: "Lecture / Day wise", label: "Lecture / Day-wise Notes" },
  { key: "Unit wise", label: "Unit-wise Notes" },
  { key: "PYQ", label: "Previous Year Questions (PYQs)" },
  { key: "Other", label: "Other Resources" },
];

interface ResourcePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectName?: string;
  alreadyAttachedTitles: string[];
  remainingSlots: number;
  onConfirm: (files: File[]) => void;
}

export function ResourcePickerDialog({
  open,
  onOpenChange,
  subjectId,
  subjectName,
  alreadyAttachedTitles,
  remainingSlots,
  onConfirm,
}: ResourcePickerDialogProps) {
  const [resources, setResources] = useState<SubjectResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState<
    Set<ResourceCategory>
  >(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Normalize attached titles for comparison
  const attachedTitlesLower = new Set(
    alreadyAttachedTitles.map((t) => t.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!open || !subjectId) return;

    setSelectedIds(new Set());
    setActionError(null);
    setLoadError(null);
    setIsLoading(true);

    fetchSubjectResources(subjectId)
      .then((data) => {
        setResources(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setLoadError(
          err instanceof Error
            ? err.message
            : "Failed to load subject resources",
        );
        setIsLoading(false);
      });
  }, [open, subjectId]);

  function toggleCategory(cat: ResourceCategory) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function toggleResource(resource: SubjectResourceItem) {
    const isAttached = attachedTitlesLower.has(
      resource.title.trim().toLowerCase(),
    );
    if (isAttached) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(resource.id)) {
        next.delete(resource.id);
      } else {
        if (next.size >= remainingSlots) return prev;
        next.add(resource.id);
      }
      return next;
    });
  }

  async function handleConfirm() {
    if (selectedIds.size === 0 || isDownloading) return;

    const toDownload = resources.filter((r) => selectedIds.has(r.id));
    setIsDownloading(true);
    setActionError(null);

    try {
      const downloadedFiles: File[] = [];
      for (const res of toDownload) {
        const file = await downloadResourceAsFile(res);
        downloadedFiles.push(file);
      }

      onConfirm(downloadedFiles);
      onOpenChange(false);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to load one or more resources.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  const selectedCount = selectedIds.size;
  const canSelectMore = selectedCount < remainingSlots;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden sm:max-h-[85vh] flex flex-col">
        <DialogHeader className="px-5 py-4 border-b bg-muted/20">
          <div className="flex items-center gap-2 text-foreground">
            <FolderOpen className="size-5 text-primary" />
            <DialogTitle className="text-base font-semibold">
              Select from Subject Resources
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Choose files from{" "}
            <span className="font-medium text-foreground">
              {subjectName || subjectId}
            </span>{" "}
            curriculum archive to attach to your AI study session.
          </DialogDescription>
        </DialogHeader>

        {/* Content body */}
        <div className="flex-1 min-h-[250px] max-h-[460px] overflow-y-auto px-5 py-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <LoaderCircle className="size-6 animate-spin text-primary" />
              <p className="text-xs">Loading curriculum resources...</p>
            </div>
          ) : loadError ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{loadError}</span>
            </div>
          ) : resources.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No files have been cataloged in this subject yet.
            </div>
          ) : (
            <div className="space-y-3">
              {CATEGORIES.map(({ key, label }) => {
                const groupItems = resources.filter((r) => r.category === key);
                if (groupItems.length === 0) return null;

                const isCollapsed = collapsedCategories.has(key);

                return (
                  <div
                    key={key}
                    className="rounded-lg border border-border bg-card/60 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCategory(key)}
                      className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-1.5">
                        {isCollapsed ? (
                          <ChevronRight className="size-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-3.5 text-muted-foreground" />
                        )}
                        <span>{label}</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 font-normal"
                      >
                        {groupItems.length}
                      </Badge>
                    </button>

                    {!isCollapsed && (
                      <div className="divide-y divide-border/50 border-t border-border">
                        {groupItems.map((resource) => {
                          const isAlreadyAttached = attachedTitlesLower.has(
                            resource.title.trim().toLowerCase(),
                          );
                          const isSelected = selectedIds.has(resource.id);
                          const isDisabled =
                            isAlreadyAttached ||
                            (!isSelected && !canSelectMore);

                          return (
                            <div
                              key={resource.id}
                              onClick={() => {
                                if (!isDisabled) toggleResource(resource);
                              }}
                              className={`flex items-center gap-3 px-3 py-2 text-xs transition-colors ${
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed bg-muted/10"
                                  : "hover:bg-muted/40 cursor-pointer"
                              } ${isSelected ? "bg-primary/5" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() => toggleResource(resource)}
                                className="size-4 shrink-0 rounded accent-primary cursor-pointer disabled:cursor-not-allowed"
                              />

                              <FileText className="size-4 shrink-0 text-muted-foreground" />

                              <span
                                className="flex-1 truncate font-medium"
                                title={resource.title}
                              >
                                {resource.title}
                              </span>

                              {isAlreadyAttached ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] shrink-0 text-muted-foreground border-muted-foreground/30"
                                >
                                  Already attached
                                </Badge>
                              ) : isSelected ? (
                                <Badge
                                  variant="default"
                                  className="text-[10px] shrink-0 gap-1 bg-primary/90 text-primary-foreground"
                                >
                                  <Check className="size-2.5" /> Selected
                                </Badge>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {actionError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <DialogFooter className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {selectedCount > 0 ? (
              <span className="font-medium text-foreground">
                {selectedCount} selected{" "}
                <span className="text-muted-foreground font-normal">
                  ({remainingSlots - selectedCount} slots remaining)
                </span>
              </span>
            ) : (
              <span>
                {remainingSlots} of 5 material slots available
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDownloading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={selectedCount === 0 || isDownloading}
              onClick={handleConfirm}
              className="gap-1.5"
            >
              {isDownloading ? (
                <>
                  <LoaderCircle className="size-3.5 animate-spin" />
                  <span>Attaching...</span>
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  <span>
                    Attach {selectedCount > 0 ? `(${selectedCount})` : ""}
                  </span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
