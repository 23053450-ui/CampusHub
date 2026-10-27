import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import type { SubjectNote } from "@/features/subject-viewer/services/types";

interface ResourceTreeProps {
  notes: SubjectNote[];
  onSelectNote: (note: SubjectNote) => void;
  selectedNoteId?: string;
}

const RESOURCE_GROUPS = [
  { title: "Lectures", tag: "Lecture" },
  { title: "Summaries", tag: "Summary" },
  { title: "Previous Year Questions", tag: "PYQ" },
  { title: "My Notes", tag: "My Notes" },
] as const;

export default function ResourceTree({
  notes,
  onSelectNote,
  selectedNoteId,
}: ResourceTreeProps) {
  const [courseExpanded, setCourseExpanded] = useState(true);

  const [expandedGroups, setExpandedGroups] = useState<
    Record<string, boolean>
  >({
    Lecture: true,
    Summary: true,
    PYQ: true,
    "My Notes": true,
  });

  function toggleGroup(tag: string) {
    setExpandedGroups((previous) => ({
      ...previous,
      [tag]: !(previous[tag] ?? false),
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="size-5 text-primary" />
        <h2 className="font-semibold">Study Resources</h2>
      </div>

      <button
        type="button"
        aria-expanded={courseExpanded}
        onClick={() => setCourseExpanded((previous) => !previous)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium hover:bg-muted"
      >
        {courseExpanded ? (
          <ChevronDown className="size-4 shrink-0" />
        ) : (
          <ChevronRight className="size-4 shrink-0" />
        )}

        {courseExpanded ? (
          <FolderOpen className="size-4 shrink-0 text-primary" />
        ) : (
          <Folder className="size-4 shrink-0 text-primary" />
        )}

        <span>Course Materials</span>

        <span className="ml-auto text-xs text-muted-foreground">
          {notes.length}
        </span>
      </button>

      {courseExpanded && (
        <div className="space-y-3 pl-3">
          {RESOURCE_GROUPS.map((group) => {
            const groupNotes = notes.filter(
              (note) => note.tag === group.tag
            );
            const isExpanded = expandedGroups[group.tag] ?? false;

            return (
              <div key={group.tag} className="space-y-1">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => toggleGroup(group.tag)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {isExpanded ? (
                    <ChevronDown className="size-3.5 shrink-0" />
                  ) : (
                    <ChevronRight className="size-3.5 shrink-0" />
                  )}

                  {isExpanded ? (
                    <FolderOpen className="size-4 shrink-0 text-primary" />
                  ) : (
                    <Folder className="size-4 shrink-0 text-primary" />
                  )}

                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.title}
                  </span>

                  <span className="ml-auto text-xs text-muted-foreground">
                    {groupNotes.length}
                  </span>
                </button>

                {isExpanded && (
                  <div className="space-y-1 pl-5">
                    {groupNotes.length === 0 ? (
                      <p className="px-2 py-1 text-xs text-muted-foreground">
                        No resources available
                      </p>
                    ) : (
                      groupNotes.map((note) => (
                        <button
                          key={note.id}
                          type="button"
                          aria-pressed={selectedNoteId === note.id}
                          onClick={() => onSelectNote(note)}
                          className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                            selectedNoteId === note.id
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <FileText className="mt-0.5 size-4 shrink-0" />
                          <span className="break-words">{note.title}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

