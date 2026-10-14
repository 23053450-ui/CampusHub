import type { Subject, Note, Flashcard, QuizQuestion, Result } from "@/types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SubjectsService {
  getSubject(subjectId: string): Promise<Result<Subject>>;
  getSubjectNotes(subjectId: string): Promise<Result<Note[]>>;
  chatWithDocument(noteId: string, message: string, contextText: string): Promise<Result<{ reply: string }>>;
  generateFlashcards(noteId: string, contextText: string): Promise<Result<Flashcard[]>>;
  generateQuiz(noteId: string, contextText: string): Promise<Result<QuizQuestion[]>>;
}
