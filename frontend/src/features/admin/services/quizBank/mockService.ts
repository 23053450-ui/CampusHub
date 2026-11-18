/**
 * @file mockService.ts
 * @description Mock implementation of the Quiz Bank Service for offline testing.
 * @owner Platform Admin Team
 */

import type { Result } from "@/shared/result";
import type {
  ApproveQuestionPayload,
  ExistingQuizQuestion,
  GenerateQuizBankParams,
  GeneratedQuizQuestion,
  QuizBankService,
  SubjectNoteSummary,
} from "./types";

const mockNotesBySubject: Record<string, SubjectNoteSummary[]> = {
  dbms: [
    {
      id: "note-dbms-1",
      title: "DBMS Unit 2: Normalization & Functional Dependencies (PYQ)",
      tag: "PYQ",
      createdAt: "2026-10-15T10:00:00Z",
    },
    {
      id: "note-dbms-2",
      title: "Relational Algebra & SQL Query Optimization",
      tag: "Lecture",
      createdAt: "2026-10-20T14:30:00Z",
    },
    {
      id: "note-dbms-3",
      title: "Transactions, ACID Properties and Concurrency Control",
      tag: "Summary",
      createdAt: "2026-10-28T09:15:00Z",
    },
  ],
  cn: [
    {
      id: "note-cn-1",
      title: "TCP Congestion Control & Windowing Mechanisms (PYQ)",
      tag: "PYQ",
      createdAt: "2026-10-12T11:00:00Z",
    },
    {
      id: "note-cn-2",
      title: "OSI Layering and Subnet Routing Algorithms",
      tag: "Lecture",
      createdAt: "2026-10-22T16:00:00Z",
    },
  ],
  os: [
    {
      id: "note-os-1",
      title: "Process Scheduling Algorithms & Deadlock Prevention",
      tag: "Lecture",
      createdAt: "2026-10-18T08:00:00Z",
    },
    {
      id: "note-os-2",
      title: "Virtual Memory, Page Replacement & Thrashing (PYQ)",
      tag: "PYQ",
      createdAt: "2026-10-25T13:45:00Z",
    },
  ],
  dsa: [
    {
      id: "note-dsa-1",
      title: "Self-Balancing Trees (AVL, Red-Black Trees) Review",
      tag: "Summary",
      createdAt: "2026-10-19T10:30:00Z",
    },
    {
      id: "note-dsa-2",
      title: "Graph Traversal & Shortest Path Problems (PYQ)",
      tag: "PYQ",
      createdAt: "2026-10-27T15:20:00Z",
    },
  ],
};

const initialExistingQuestions: ExistingQuizQuestion[] = [
  {
    id: "dbms-001",
    subjectId: "dbms",
    topic: "Normalization",
    difficulty: "medium",
    question: "Which normal form deals with removing transitive dependencies?",
    options: ["1NF", "2NF", "3NF", "BCNF"],
    correctAnswerIndex: 2,
    explanation: "3NF removes transitive dependencies where non-prime attributes depend on other non-prime attributes.",
    source: "manual",
    status: "approved",
    createdAt: "2026-10-31T00:00:00Z",
  },
  {
    id: "cn-001",
    subjectId: "cn",
    topic: "OSI Model",
    difficulty: "easy",
    question: "Which layer in the OSI model is responsible for end-to-end packet routing across networks?",
    options: ["Data Link Layer", "Transport Layer", "Network Layer", "Session Layer"],
    correctAnswerIndex: 2,
    explanation: "The Network Layer (Layer 3) handles logical addressing and packet routing across networks.",
    source: "pyq",
    status: "approved",
    createdAt: "2026-10-31T00:00:00Z",
  },
  {
    id: "os-001",
    subjectId: "os",
    topic: "Deadlocks",
    difficulty: "medium",
    question: "Which of the following is NOT one of Coffman's four conditions for deadlock?",
    options: ["Mutual Exclusion", "Hold and Wait", "Preemption", "Circular Wait"],
    correctAnswerIndex: 2,
    explanation: "The condition is 'No Preemption'. Preemption actively avoids or resolves deadlocks.",
    source: "pyq",
    status: "approved",
    createdAt: "2026-10-31T00:00:00Z",
  },
];

let existingQuestionsState: ExistingQuizQuestion[] = [...initialExistingQuestions];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockQuizBankService: QuizBankService = {
  async getSubjects() {
    await delay(150);
    return {
      data: [
        { id: "dbms", name: "Database Management Systems", code: "CS301" },
        { id: "cn", name: "Computer Networks", code: "CS302" },
        { id: "os", name: "Operating Systems", code: "CS303" },
        { id: "dsa", name: "Data Structures & Algorithms", code: "CS201" },
        { id: "daa", name: "Design & Analysis of Algorithms", code: "CS304" },
        { id: "dm", name: "Discrete Mathematics", code: "CS202" },
      ],
      error: null,
    };
  },

  async getApprovedNotes(subjectId: string): Promise<Result<SubjectNoteSummary[]>> {
    await delay(200);
    const notes = mockNotesBySubject[subjectId] || [
      {
        id: `note-${subjectId}-1`,
        title: `${subjectId.toUpperCase()} Core Concepts Handout`,
        tag: "Summary",
        createdAt: new Date().toISOString(),
      },
    ];
    return { data: notes, error: null };
  },

  async getExistingQuestions(subjectId: string): Promise<Result<ExistingQuizQuestion[]>> {
    await delay(200);
    return {
      data: existingQuestionsState.filter((q) => q.subjectId === subjectId),
      error: null,
    };
  },

  async generateQuestions(
    params: GenerateQuizBankParams,
  ): Promise<Result<{ title: string; questions: GeneratedQuizQuestion[] }>> {
    await delay(1200);

    const generated: GeneratedQuizQuestion[] = [];
    const count = Math.min(params.count, 10);

    for (let i = 1; i <= count; i++) {
      generated.push({
        tempId: `temp-${Date.now()}-${i}`,
        question: `[AI Generated #${i}] In ${params.subjectId.toUpperCase()}, which mechanism is used to ensure consistency in ${params.topic || "core operations"}?`,
        options: [
          "Two-Phase Locking (2PL) protocol",
          "Unsynchronized concurrent threads",
          "Static buffer overflow redirection",
          "Direct client-side memory override",
        ],
        correctIndex: 0,
        explanation: `Two-Phase Locking guarantees serializability by segregating the transaction lifecycle into a growing phase and a shrinking phase.`,
        difficulty: params.difficulty || (i % 2 === 0 ? "hard" : "medium"),
        topic: params.topic || "Core Principles",
      });
    }

    return {
      data: {
        title: `${params.subjectId.toUpperCase()} Generated Deck`,
        questions: generated,
      },
      error: null,
    };
  },

  async approveQuestions(
    subjectId: string,
    questions: ApproveQuestionPayload[],
  ): Promise<Result<{ inserted: number }>> {
    await delay(400);

    const newRows: ExistingQuizQuestion[] = questions.map((q, idx) => ({
      id: `${subjectId}-mock-${Date.now()}-${idx}`,
      subjectId,
      question: q.question,
      options: q.options,
      correctAnswerIndex: q.correctIndex,
      explanation: q.explanation,
      difficulty: q.difficulty,
      topic: q.topic,
      source: "ai",
      status: "approved",
      createdAt: new Date().toISOString(),
    }));

    existingQuestionsState = [...newRows, ...existingQuestionsState];

    return {
      data: { inserted: newRows.length },
      error: null,
    };
  },

  async deleteQuestion(questionId: string): Promise<Result<void>> {
    await delay(200);
    existingQuestionsState = existingQuestionsState.filter((q) => q.id !== questionId);
    return { data: undefined, error: null };
  },
};
