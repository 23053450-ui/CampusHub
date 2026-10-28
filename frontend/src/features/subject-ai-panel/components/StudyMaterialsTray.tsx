import { useRef, type ChangeEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Paperclip,
  Plus,
  X,
} from "lucide-react";
import {
  MAX_STUDY_MATERIALS,
  type StudyMaterial,
} from "../hooks/useStudyMaterials";

interface Props {
  materials: StudyMaterial[];
  isLoading: boolean;
  uploadingFile: string | null;
  removingId: string | null;
  error: string | null;
  onAddFiles: (files: File[]) => void;
  onToggle: (materialId: string) => void;
  onRemove: (materialId: string) => void;
  onDismissError: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(title: string, kind: StudyMaterial["kind"]): string {
  const extension = title.split(".").pop()?.toUpperCase();
  return kind === "pdf" ? "PDF" : extension === "MD" ? "Markdown" : "Text file";
}

export function StudyMaterialsTray({
  materials,
  isLoading,
  uploadingFile,
  removingId,
  error,
  onAddFiles,
  onToggle,
  onRemove,
  onDismissError,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canAddMore = materials.length < MAX_STUDY_MATERIALS && !uploadingFile;
  const selectedCount = materials.filter((material) => material.selected).length;

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length) onAddFiles(files);
  }

  return (
    <section className="shrink-0 border-b px-3 py-2" aria-label="Shared study materials">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
          <h3 className="truncate text-xs font-semibold">Study materials</h3>
          <span className="text-[11px] text-muted-foreground">
            {materials.length}/{MAX_STUDY_MATERIALS}
          </span>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canAddMore}
          title={materials.length >= MAX_STUDY_MATERIALS ? "Remove a file before adding more" : "Add PDF, TXT or MD files"}
          aria-label="Add study materials"
          className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploadingFile ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
          className="hidden"
          onChange={handleFilesSelected}
        />
      </div>

      {materials.length > 0 && (
        <div className="mt-2 max-h-36 space-y-1 overflow-y-auto pr-0.5">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={material.selected}
                onChange={() => onToggle(material.id)}
                aria-label={`Use ${material.title} for study tools`}
                className="size-3.5 shrink-0 accent-primary"
              />
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium" title={material.title}>{material.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {fileKind(material.title, material.kind)} · {formatSize(material.size_bytes)}
                </p>
              </div>
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <button
                type="button"
                onClick={() => onRemove(material.id)}
                disabled={removingId === material.id}
                aria-label={`Remove ${material.title}`}
                title="Remove file"
                className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                {removingId === material.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {isLoading && materials.length === 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">Loading this subject's materials…</p>
      )}
      {!isLoading && materials.length === 0 && !uploadingFile && (
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Upload PDF, TXT or MD notes. The next step will connect these selected files to Chat, Flashcards and Quiz.
        </p>
      )}
      {uploadingFile && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <LoaderCircle className="size-3.5 animate-spin" />
          Uploading {uploadingFile}…
        </p>
      )}
      {materials.length > 0 && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          {selectedCount} of {materials.length} selected
        </p>
      )}
      {error && (
        <div className="mt-2 flex items-start gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-[11px] text-destructive" role="alert">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <p className="min-w-0 flex-1">{error}</p>
          <button type="button" onClick={onDismissError} aria-label="Dismiss error" className="shrink-0 rounded p-0.5 hover:bg-destructive/10">
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </section>
  );
}
