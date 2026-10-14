import type { QuizQuestion, Result } from "@/types";
import type {
  DailyQuizService,
  TodayQuizResponse,
  QuizSubmissionResult,
  UserStreak,
} from "./types";

const mockQuestions: QuizQuestion[] = [
  {
    id: "dq-1",
    question: "What is the worst-case time complexity of QuickSort when using a naive last-element pivot on an already sorted array?",
    options: ["O(n log n)", "O(n)", "O(n^2)", "O(log n)"],
    correctAnswerIndex: 2,
    explanation:
      "When the array is already sorted and the pivot chosen is always the last element, partitioning produces unbalanced subproblems of size n-1 and 0, yielding O(n^2) runtime.",
  },
  {
    id: "dq-2",
    question: "In TCP/IP networking, what does the SYN-ACK packet achieve during the three-way handshake?",
    options: [
      "Closes an established connection gracefully",
      "Acknowledges client SYN and synchronizes server sequence numbers",
      "Requests a DNS domain resolution",
      "Terminates an idle socket connection",
    ],
    correctAnswerIndex: 1,
    explanation:
      "The server responds to the initial SYN with SYN-ACK, acknowledging the client's sequence number and presenting its own sequence number for the connection.",
  },
  {
    id: "dq-3",
    question: "Which CPU scheduling algorithm can lead to indefinite starvation of low-priority processes?",
    options: [
      "Round Robin (RR)",
      "First-Come, First-Served (FCFS)",
      "Strict Priority Scheduling without aging",
      "Shortest Remaining Time First with aging",
    ],
    correctAnswerIndex: 2,
    explanation:
      "In static priority scheduling without aging mechanisms, higher priority processes can continually preempt lower priority ones, causing starvation.",
  },
];

const mockStreak: UserStreak = {
  currentStreak: 5,
  bestStreak: 12,
  lastCompletedDate: new Date(Date.now() - 86400000).toISOString().split("T")[0],
};

export const mockDailyQuizService: DailyQuizService = {
  async getTodayQuiz(): Promise<Result<TodayQuizResponse>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      data: {
        date: new Date().toISOString().split("T")[0],
        questions: mockQuestions,
      },
      error: null,
    };
  },

  async submitQuiz(answers: Record<string, number>): Promise<Result<QuizSubmissionResult>> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    let score = 0;
    mockQuestions.forEach((q) => {
      if (answers[q.id] === q.correctAnswerIndex) {
        score += 1;
      }
    });

    mockStreak.currentStreak += 1;
    if (mockStreak.currentStreak > mockStreak.bestStreak) {
      mockStreak.bestStreak = mockStreak.currentStreak;
    }
    mockStreak.lastCompletedDate = new Date().toISOString().split("T")[0];

    return {
      data: {
        score,
        total: mockQuestions.length,
        streakCount: mockStreak.currentStreak,
      },
      error: null,
    };
  },

  async getUserStreak(): Promise<Result<UserStreak>> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { data: { ...mockStreak }, error: null };
  },
};
