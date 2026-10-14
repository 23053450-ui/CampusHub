import type { Subject, Note, Flashcard, QuizQuestion, Result } from "@/types";
import type { SubjectsService } from "./types";

const mockSubject: Subject = {
  id: "cs301",
  name: "Database Management Systems",
  code: "CS301",
  userCount: 98,
  isEnrolled: true,
};

const mockNotes: Note[] = [
  {
    id: "note-101",
    subjectId: "cs301",
    userId: "mock-student-uuid",
    title: "Unit 1: ER Modeling & Relational Algebra",
    description: "Entities, attributes, relationships, selection, projection, joins, and relational calculus.",
    storagePath: "subject-notes/cs301/unit1-er-model.pdf",
    tag: "Lecture",
    isShared: true,
    isApproved: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "note-102",
    subjectId: "cs301",
    userId: "mock-student-uuid",
    title: "Unit 2: Normalization & Functional Dependencies",
    description: "1NF, 2NF, 3NF, BCNF, lossless join decomposition, and dependency preservation proofs.",
    storagePath: "subject-notes/cs301/unit2-normalization.pdf",
    tag: "Summary",
    isShared: true,
    isApproved: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "note-103",
    subjectId: "cs301",
    userId: "mock-student-uuid",
    title: "Mid-Semester Exam 2024 Solution Key",
    description: "Solved questions with detailed step-by-step query explanations.",
    storagePath: "subject-notes/cs301/pyq-2024-solved.pdf",
    tag: "PYQ",
    isShared: true,
    isApproved: true,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const mockFlashcards: Flashcard[] = [
  {
    question: "What is the primary condition for Boyce-Codd Normal Form (BCNF)?",
    answer: "For every non-trivial functional dependency X -> Y, X must be a superkey of the relation.",
  },
  {
    question: "What is the difference between 3NF and BCNF?",
    answer: "In 3NF, Y can also be a prime attribute (part of a candidate key). In BCNF, X strictly must be a superkey regardless of Y.",
  },
  {
    question: "What is an Armstrong's Axiom: Transitivity Rule?",
    answer: "If X -> Y and Y -> Z hold, then X -> Z also holds.",
  },
];

const mockQuiz: QuizQuestion[] = [
  {
    id: "q-1",
    question: "Which of the following normal forms guarantees dependency preservation for all valid decompositions?",
    options: ["1NF", "2NF", "3NF", "BCNF"],
    correctAnswerIndex: 2,
    explanation: "3NF always allows a dependency-preserving and lossless-join decomposition, whereas BCNF may lose functional dependencies.",
  },
  {
    id: "q-2",
    question: "What does the ACID property 'Atomicity' guarantee?",
    options: [
      "All transactions run in serial order",
      "All operations in a transaction complete fully or none at all",
      "Data remains consistent before and after a crash",
      "Changes persist across disk failures",
    ],
    correctAnswerIndex: 1,
    explanation: "Atomicity ensures 'all-or-nothing' execution of transaction operations.",
  },
];

export const mockSubjectsService: SubjectsService = {
  async getSubject(subjectId: string): Promise<Result<Subject>> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return {
      data: { ...mockSubject, id: subjectId },
      error: null,
    };
  },

  async getSubjectNotes(subjectId: string): Promise<Result<Note[]>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      data: mockNotes.map((n) => ({ ...n, subjectId })),
      error: null,
    };
  },

  async chatWithDocument(noteId: string, message: string, contextText: string): Promise<Result<{ reply: string }>> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      data: {
        reply: `Based on your note (context: "${contextText.slice(0, 40)}..."): ${message} is governed by functional dependency closure and decomposition principles. Keep in mind that candidate keys determine the minimal determinant set.`,
      },
      error: null,
    };
  },

  async generateFlashcards(noteId: string, _contextText: string): Promise<Result<Flashcard[]>> {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { data: mockFlashcards, error: null };
  },

  async generateQuiz(noteId: string, _contextText: string): Promise<Result<QuizQuestion[]>> {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { data: mockQuiz, error: null };
  },
};
