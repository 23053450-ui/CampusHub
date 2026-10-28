import { ArrowUp, LoaderCircle, Plus, Square } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

type Props = {
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  onAddFiles?: (files: File[]) => void;
  isUploadingFiles?: boolean;
  canAddFiles?: boolean;
};

export function ChatInput({
  isStreaming,
  onSend,
  onStop,
  onAddFiles,
  isUploadingFiles = false,
  canAddFiles = true,
}: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wasStreaming = useRef(false);

  // Grow with the text, up to 128px.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [value]);

  // Put the cursor back in the box when a reply finishes.
  useEffect(() => {
    if (wasStreaming.current && !isStreaming) ref.current?.focus();
    wasStreaming.current = isStreaming;
  }, [isStreaming]);

  function submit() {
    if (!value.trim() || isStreaming) return;
    onSend(value);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter makes a new line.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  function handleFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.currentTarget.files ?? []);
    e.currentTarget.value = "";
    if (files.length) onAddFiles?.(files);
  }

  return (
    <div className="border-t p-3">
      <div className="flex items-end gap-2 rounded-xl border bg-background p-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!onAddFiles || !canAddFiles || isUploadingFiles}
          aria-label="Add study materials"
          title="Add PDF, TXT or MD notes"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isUploadingFiles ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-5" />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
          className="hidden"
          onChange={handleFilesSelected}
        />
        <textarea
          ref={ref}
          rows={1}
          maxLength={4000}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this subject…"
          className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm outline-none"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted hover:bg-muted/70"
          >
            <Square className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim()}
            aria-label="Send message"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-700 text-white disabled:opacity-40"
          >
            <ArrowUp className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
