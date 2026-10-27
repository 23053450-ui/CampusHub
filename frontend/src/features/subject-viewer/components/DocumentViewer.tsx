import { FileText, Maximize2 } from "lucide-react";

interface DocumentViewerProps {
  title?: string;
  content?: string;
  loading?: boolean;
}

export default function DocumentViewer({
  title,
  content,
  loading = false,
}: DocumentViewerProps) {
  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Loading study material...
        </p>
      </div>
    );
  }

  if (!title) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
          <FileText className="size-7 text-muted-foreground" />
        </div>

        <h3 className="font-semibold">Your study workspace</h3>

        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Select a lecture, summary, or previous year question from the
          resource tree to view its content here.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex min-w-0 items-center gap-3">
          <FileText className="size-5 shrink-0 text-primary" />
          <h2 className="truncate font-semibold">{title}</h2>
        </div>

        <Maximize2 className="size-4 shrink-0 text-muted-foreground" />
      </header>

      <div className="min-h-[300px] whitespace-pre-wrap p-5 text-sm leading-7 text-foreground sm:p-6">
        {content || "No preview content is available for this resource."}
      </div>
    </section>
  );
}
