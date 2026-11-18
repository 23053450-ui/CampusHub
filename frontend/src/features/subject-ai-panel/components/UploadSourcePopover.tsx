import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { FolderOpen, LoaderCircle, Plus, Upload } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ResourcePickerDialog } from "./ResourcePickerDialog";

interface UploadSourcePopoverProps {
  subjectId: string;
  subjectName?: string;
  onAddFiles?: (files: File[]) => void;
  isUploadingFiles?: boolean;
  canAddFiles?: boolean;
  disabled?: boolean;
  alreadyAttachedTitles?: string[];
  maxMaterials?: number;
  currentMaterialsCount?: number;
  triggerClassName?: string;
  tooltipTitle?: string;
}

export function UploadSourcePopover({
  subjectId,
  subjectName,
  onAddFiles,
  isUploadingFiles = false,
  canAddFiles = true,
  disabled = false,
  alreadyAttachedTitles = [],
  maxMaterials = 5,
  currentMaterialsCount = 0,
  triggerClassName = "flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
  tooltipTitle = "Add study materials",
}: UploadSourcePopoverProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isButtonDisabled =
    disabled || !onAddFiles || !canAddFiles || isUploadingFiles;

  function handleFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.currentTarget.files ?? []);
    e.currentTarget.value = "";

    if (files.length > 0) {
      onAddFiles?.(files);
    }
  }

  const remainingSlots = Math.max(0, maxMaterials - currentMaterialsCount);

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={isButtonDisabled}
            aria-label="Add study materials"
            title={tooltipTitle}
            className={triggerClassName}
          >
            {isUploadingFiles ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-5" />
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="top"
          sideOffset={8}
          className="w-64 p-1.5 shadow-lg border-border"
        >
          <div className="space-y-0.5">
            {/* Option 1: Upload from computer */}
            <button
              type="button"
              onClick={() => {
                setPopoverOpen(false);
                fileInputRef.current?.click();
              }}
              className="flex w-full items-start gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-muted cursor-pointer"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                <Upload className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground leading-tight">
                  Upload from computer
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">
                  PDF, TXT, or Markdown
                </p>
              </div>
            </button>

            {/* Option 2: Select from resources */}
            <button
              type="button"
              onClick={() => {
                setPopoverOpen(false);
                setPickerOpen(true);
              }}
              className="flex w-full items-start gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-muted cursor-pointer"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FolderOpen className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground leading-tight">
                  Select from resources
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">
                  Curriculum notes & PYQs
                </p>
              </div>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Hidden file input for native file browser */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Modal dialog for selecting community resources */}
      <ResourcePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        subjectId={subjectId}
        subjectName={subjectName}
        alreadyAttachedTitles={alreadyAttachedTitles}
        remainingSlots={remainingSlots}
        onConfirm={(files) => {
          onAddFiles?.(files);
        }}
      />
    </>
  );
}
