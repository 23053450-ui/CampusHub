import type { Result } from "@/shared/result";
import type { Subject } from "@/shared/user";
import type { SubjectNote, SubjectViewerService } from "./types";

const mockSubjects: Record<string, Subject> = {
  cs301: {
    id: "cs301",
    name: "Database Management Systems",
    code: "CS301",
  },
  cs302: {
    id: "cs302",
    name: "Computer Networks",
    code: "CS302",
  },
  cs303: {
    id: "cs303",
    name: "Operating Systems",
    code: "CS303",
  },
  cs304: {
    id: "cs304",
    name: "Software Engineering",
    code: "CS304",
  },
};

export const mockSubjectViewerService: SubjectViewerService = {
  async getSubject(subjectId: string): Promise<Result<Subject>> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const subject = mockSubjects[subjectId.toLowerCase()];

    if (!subject) {
      return {
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "Subject not found.",
        },
      };
    }

    return { data: subject, error: null };
  },

  async getNotesTree(subjectId: string): Promise<Result<SubjectNote[]>> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const subject = mockSubjects[subjectId.toLowerCase()];

    if (!subject) {
      return {
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "Subject not found.",
        },
      };
    }

    const notes: SubjectNote[] = [
      {
        id: `${subjectId}-note-1`,
        subjectId,
        title: "Unit 1: Introduction and Fundamentals",
        tag: "Lecture",
        storagePath: "notes/unit-1.pdf",
      },
      {
        id: `${subjectId}-note-2`,
        subjectId,
        title: "Unit 2: Core Concepts",
        tag: "Summary",
        storagePath: "notes/unit-2.pdf",
      },
      {
        id: `${subjectId}-note-3`,
        subjectId,
        title: "Previous Year Questions",
        tag: "PYQ",
        storagePath: "notes/previous-year-questions.pdf",
      },
      {
        id: `${subjectId}-note-4`,
        subjectId,
        title: "My Personal Notes",
        tag: "My Notes",
        storagePath: "notes/my-notes.txt",
      },
    ];

    return { data: notes, error: null };
  },

  async getNoteContent(storagePath: string): Promise<Result<Blob>> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      data: new Blob(
        [
          `Sample study material\n\nFile: ${storagePath}\n\nThis is placeholder content for the Subject Viewer mock interface.`,
        ],
        { type: "text/plain" },
      ),
      error: null,
    };
  },
};
