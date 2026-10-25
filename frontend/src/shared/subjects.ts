import type { Subject } from "@/shared/user";

export const subjects: Subject[] = [
  { id: "cs301", name: "Database Management Systems", code: "CS301" },
  { id: "cs302", name: "Computer Networks", code: "CS302" },
  { id: "cs303", name: "Operating Systems", code: "CS303" },
  { id: "cs304", name: "Design and Analysis of Algorithms", code: "CS304" },
];

export function getSubjectById(id?: string): Subject | undefined {
  return subjects.find((s) => s.id === id);
}