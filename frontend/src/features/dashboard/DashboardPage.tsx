import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowBigDown,
  ArrowBigUp,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Flame,
  MessageSquare,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHeader } from "@/lib/header-context";
import { useUserSubjects } from "@/lib/user-subjects-context";
import type { Post } from "@/shared/communities";
import { dashboardService } from "./services";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const YEARS = Array.from({ length: 9 }, (_, i) => 2022 + i);

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "";
  }
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const {
    enrolledSubjects,
    isLoading: loadingSubjects,
    openModal: openSubjectModal,
  } = useUserSubjects();

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [calendarMonth, setCalendarMonth] = useState<Date>(today);
  const [hotPosts, setHotPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Daily Quiz streak and calendar progress state
  const [streakCount, setStreakCount] = useState<number>(0);
  const [completedDates, setCompletedDates] = useState<Date[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDiscussions() {
      try {
        setLoadingPosts(true);
        const postsRes = await dashboardService.getHotDiscussions(5);
        if (isMounted && postsRes.data) {
          setHotPosts(postsRes.data);
        }
      } catch (err) {
        console.error("Failed to load hot discussions:", err);
      } finally {
        if (isMounted) {
          setLoadingPosts(false);
        }
      }
    }

    async function loadQuizData() {
      try {
        const summaryRes = await dashboardService.getDailyQuizSummary();
        if (!isMounted) return;

        if (summaryRes.data) {
          setStreakCount(summaryRes.data.currentStreak);

          const parsed = summaryRes.data.completedDates.map((ds) => {
            const [y, m, d] = ds.split("-").map(Number);
            return new Date(y, m - 1, d);
          });
          setCompletedDates(parsed);
        }
      } catch (err) {
        console.error("Failed to load quiz dashboard data:", err);
      }
    }

    void loadDiscussions();
    void loadQuizData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Set the clickable streak badge in the top navbar header actions
  useEffect(() => {
    setActions(
      <button
        type="button"
        onClick={() => navigate("/daily-quiz")}
        className="group flex items-center gap-1.5 sm:gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 sm:px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
        title="View Daily Quiz & Streak"
      >
        <Flame className="size-4 text-amber-500 fill-amber-500 animate-pulse group-hover:scale-110 transition-transform shrink-0" />
        <span className="font-bold">
          {streakCount} Day{streakCount === 1 ? "" : "s"}
        </span>
      </button>,
    );

    return () => {
      setActions(null);
    };
  }, [setActions, streakCount, navigate]);

  return (
    <div className="min-h-full w-full min-w-0 bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Subjects & Calendar Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] items-stretch">
          {/* My Subjects */}
          <Card className="flex flex-col border-border/70 bg-card shadow-xs rounded-2xl overflow-hidden h-full">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-4 py-2.5 sm:px-5 sm:py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-semibold text-foreground">
                  My Subjects
                </CardTitle>
                <span className="text-xs text-muted-foreground font-medium">
                  {enrolledSubjects.length} enrolled
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openSubjectModal}
                className="h-8 gap-1.5 text-xs cursor-pointer"
                title="Add or remove enrolled subjects"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Manage Subjects</span>
              </Button>
            </CardHeader>

            <CardContent className="flex-1 p-4 sm:p-5 pt-2.5 sm:pt-3 flex flex-col">
              {loadingSubjects ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Loading enrolled subjects...
                </div>
              ) : enrolledSubjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    No subjects enrolled yet
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
                    Select the courses you are attending this semester to access your study notes, communities, and subject tools.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={openSubjectModal}
                    className="mt-4 gap-1.5 cursor-pointer text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Select Subjects
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {enrolledSubjects.map((subject) => {
                    return (
                      <Link
                        key={subject.id}
                        to={`/subjects/${subject.id}`}
                        className="group flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/30 hover:shadow-xs min-h-[96px]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="rounded-md border border-border/70 bg-muted/60 px-2 py-0.5 font-mono text-xs font-normal text-muted-foreground group-hover:border-primary/40 transition-colors">
                            {subject.code}
                          </span>
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                        </div>

                        <div className="pt-3">
                          <p className="text-sm font-normal text-foreground transition-colors group-hover:text-primary line-clamp-1">
                            {subject.name}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendar - Interactive Month/Year Selectors with Daily Quiz dots */}
          <Card className="flex flex-col border-border/70 bg-card shadow-xs rounded-2xl overflow-hidden h-full">
            {/* Direct Month & Year dropdown controls */}
            <div className="flex items-center justify-between border-b border-border/70 px-3 py-2 sm:px-4 sm:py-2.5">
              <div className="flex items-center gap-1.5">
                <Select
                  value={calendarMonth.getMonth().toString()}
                  onValueChange={(val) => {
                    const m = parseInt(val, 10);
                    setCalendarMonth(new Date(calendarMonth.getFullYear(), m, 1));
                  }}
                >
                  <SelectTrigger className="h-8 w-[114px] text-xs font-medium bg-muted/40 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, idx) => (
                      <SelectItem key={idx} value={idx.toString()} className="text-xs">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={calendarMonth.getFullYear().toString()}
                  onValueChange={(val) => {
                    const y = parseInt(val, 10);
                    setCalendarMonth(new Date(y, calendarMonth.getMonth(), 1));
                  }}
                >
                  <SelectTrigger className="h-8 w-[78px] text-xs font-medium bg-muted/40 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y.toString()} className="text-xs">
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
                    )
                  }
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
                    )
                  }
                  aria-label="Next month"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <CardContent className="flex-1 p-3 sm:p-4 flex flex-col justify-center">
              <Calendar
                mode="single"
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{
                  quizCompleted: completedDates,
                }}
                classNames={{
                  nav: "hidden",
                  month_caption: "hidden",
                }}
                showOutsideDays
                className="w-full p-0"
              />
            </CardContent>
          </Card>
        </div>

        {/* Hot Community Discussions */}
        <Card className="border-border/70 bg-card shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-5 py-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Hot Discussions
            </CardTitle>

            <Link
              to="/communities"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              View all
              <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="p-2 sm:p-3">
            {loadingPosts ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading hot discussions...
              </div>
            ) : hotPosts.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No trending discussions right now.
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {hotPosts.map((post) => {
                  const subject = enrolledSubjects.find(
                    (s) => s.id === post.subjectId
                  );
                  const netScore = post.upvotes - post.downvotes;

                  return (
                    <Link
                      key={post.id}
                      to={`/communities/${post.subjectId}/post/${post.id}`}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-3 px-3 rounded-lg transition-colors hover:bg-muted/40"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="shrink-0 rounded px-2 py-0.5 font-mono text-[11px] font-medium bg-muted/80 text-muted-foreground border border-border/50">
                          {subject?.code || post.subjectId.toUpperCase()}
                        </span>

                        <h3 className="line-clamp-1 text-sm text-foreground transition-colors group-hover:text-primary font-normal">
                          {post.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground pl-11 sm:pl-0">
                        {/* Vote count capsule */}
                        <div
                          className="inline-flex h-7 items-center rounded-lg border border-border/80 bg-secondary/40 px-1 text-xs text-muted-foreground"
                          title="Open post to vote"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded transition-colors group-hover:text-foreground">
                            <ArrowBigUp className="size-3.5" />
                          </span>
                          <span className="min-w-[1.25rem] px-0.5 text-center font-medium text-foreground text-xs">
                            {netScore}
                          </span>
                          <span className="flex h-5 w-5 items-center justify-center rounded transition-colors group-hover:text-foreground">
                            <ArrowBigDown className="size-3.5" />
                          </span>
                        </div>

                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="size-3.5 text-muted-foreground/80" />
                          {post.replyCount || 0} {post.replyCount === 1 ? "reply" : "replies"}
                        </span>
                        <span>•</span>
                        <span>{formatRelativeTime(post.createdAt)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
