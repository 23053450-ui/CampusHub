import type { Result } from "@/shared/result";
import type { Subject } from "@/shared/user";

export interface SubjectNote {
  id: string;
  subjectId: string;
  title: string;
  tag: "Lecture" | "PYQ" | "Summary" | "My Notes";
  storagePath: string;
  contentUrl?: string;
}

export interface SubjectViewerService {
  getSubject(subjectId: string): Promise<Result<Subject>>;
  getNotesTree(subjectId: string): Promise<Result<SubjectNote[]>>;
  getNoteContent(storagePath: string): Promise<Result<Blob>>;
}
