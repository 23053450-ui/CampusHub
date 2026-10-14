import type { UserProfile, Subject, Result } from "@/types";
import type { DashboardService } from "./types";

const mockProfile: UserProfile = {
  id: "mock-student-uuid",
  handle: "alex_chen",
  fullName: "Alex Chen",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
  role: "student",
  createdAt: new Date().toISOString(),
};

const mockSubjects: Subject[] = [
  {
    id: "cs101",
    name: "Data Structures & Algorithms",
    code: "CS101",
    userCount: 142,
    isEnrolled: true,
  },
  {
    id: "cs201",
    name: "Database Management Systems",
    code: "CS201",
    userCount: 98,
    isEnrolled: true,
  },
  {
    id: "cs301",
    name: "Operating Systems",
    code: "CS301",
    userCount: 115,
    isEnrolled: false,
  },
  {
    id: "cs401",
    name: "Computer Networks",
    code: "CS401",
    userCount: 89,
    isEnrolled: false,
  },
];

export const mockDashboardService: DashboardService = {
  async getProfile(): Promise<Result<UserProfile>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: mockProfile, error: null };
  },

  async getEnrolledSubjects(): Promise<Result<Subject[]>> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return {
      data: mockSubjects.filter((s) => s.isEnrolled),
      error: null,
    };
  },

  async getAllSubjects(): Promise<Result<Subject[]>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: mockSubjects, error: null };
  },

  async enrollSubject(subjectId: string): Promise<Result<void>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const target = mockSubjects.find((s) => s.id === subjectId);
    if (target) {
      target.isEnrolled = true;
      target.userCount += 1;
    }
    return { data: undefined, error: null };
  },
};
