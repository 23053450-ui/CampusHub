import { useEffect, useState } from "react";
import { AlertCircle, BookOpen, LoaderCircle } from "lucide-react";

import ResourceTree from "./components/ResourceTree";
import DocumentViewer from "./components/DocumentViewer";
import { subjectViewerService } from "./services";
import type { SubjectNote } from "./services/types";
import type { Subject } from "@/shared/user";

export default function SubjectViewerPage() {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [notes, setNotes] = useState<SubjectNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<SubjectNote | null>(null);
  const [documentContent, setDocumentContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSubject() {
      setLoading(true);
      setError("");

      try {
        const subjectId = window.location.pathname
          .split("/")
          .filter(Boolean)
          .pop();

        if (!subjectId) {
          throw new Error("No subject was selected.");
        }

        const [subjectResult, notesResult] = await Promise.all([
          subjectViewerService.getSubject(subjectId),
          subjectViewerService.getNotesTree(subjectId),
        ]);

        if (cancelled) return;

        if (subjectResult.error) {
          throw new Error(subjectResult.error.message);
        }

        if (notesResult.error) {
          throw new Error(notesResult.error.message);
        }

        setSubject(subjectResult.data);
        setNotes(notesResult.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading the subject."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSubject();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSelectNote(note: SubjectNote) {
    setSelectedNote(note);
    setDocumentContent("");
    setDocumentLoading(true);
    setError("");

    try {
      const result = await subjectViewerService.getNoteContent(
        note.storagePath
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      const content = await result.data.text();
      setDocumentContent(content);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load this resource."
      );
    } finally {
      setDocumentLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" />
        <span>Loading subject...</span>
      </div>
    );
  }

  if (error && !subject) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-destructive">
        <AlertCircle className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="font-semibold">Unable to open subject</h2>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="rounded-xl border p-6 text-center">
        <BookOpen className="mx-auto mb-3 size-8 text-muted-foreground" />
        <h2 className="font-semibold">Subject not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This subject may not exist or may be unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">
          Study Workspace / {subject.code}
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {subject.name}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Access lectures, summaries, previous year questions, and your notes.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-w-0 rounded-xl border bg-card p-4">
          <ResourceTree
            notes={notes}
            onSelectNote={handleSelectNote}
            selectedNoteId={selectedNote?.id}
          />
        </aside>

        <section className="min-w-0 rounded-xl border bg-card p-4 md:p-6">
          <DocumentViewer
            title={selectedNote?.title}
            content={documentContent}
            loading={documentLoading}
          />
        </section>
      </div>
    </div>
  );
}
