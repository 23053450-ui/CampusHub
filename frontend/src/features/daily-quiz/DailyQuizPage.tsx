import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Brain,
  Flame,
  CheckCircle2,
  RotateCcw,
  Trophy,
  AlertCircle,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  StreakBadge,
  QuizPlayer,
  ResultModal,
  ExplanationDrawer,
} from "./components";

import { dailyQuizService } from "./services";
import type {
  QuestionFeedbackItem,
  QuizQuestion,
  UserStreak,
  TodaySubmission,
} from "./services";

export default function DailyQuizPage() {
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [feedbackDetails, setFeedbackDetails] = useState<
    Record<string, QuestionFeedbackItem>
  >({});
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [todaySubmission, setTodaySubmission] = useState<TodaySubmission | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isExplanationDrawerOpen, setIsExplanationDrawerOpen] = useState(false);

  const isMock = import.meta.env.VITE_USE_MOCKS === "true";

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    setAlreadyCompletedToday(false);
    setTodaySubmission(null);
    setIsResultModalOpen(false);
    setIsExplanationDrawerOpen(false);

    // 1. Fetch today's assigned quiz questions
    const quizResult = await dailyQuizService.getTodayQuiz();

    if (quizResult.error) {
      setErrorMessage(quizResult.error.message);
      setLoading(false);
      return;
    }

    const questions = quizResult.data.questions || [];
    setQuizQuestions(questions);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setScore(0);
    setQuizFinished(false);
    setFeedbackDetails({});
    isSubmittingRef.current = false;

    // 2. Fetch current streak
    const streakResult = await dailyQuizService.getUserStreak();
    if (!streakResult.error && streakResult.data) {
      setStreak(streakResult.data);
    }

    // 3. Check if already completed today
    if (quizResult.data.alreadySubmitted) {
      setAlreadyCompletedToday(true);
      const subResult = await dailyQuizService.getTodaySubmission();
      if (!subResult.error && subResult.data) {
        setTodaySubmission(subResult.data);
        setScore(subResult.data.score);
        setAnswers(subResult.data.answers || {});
        if (subResult.data.details) {
          setFeedbackDetails(subResult.data.details);
        }
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadQuiz();
  }, [loadQuiz]);

  const activeQuestion = quizQuestions[currentQuestionIndex];
  const selectedAnswer =
    activeQuestion && answers[activeQuestion.id] !== undefined
      ? answers[activeQuestion.id]
      : null;

  // Handle option selection
  const handleSelectOption = (optionIndex: number) => {
    if (!activeQuestion || isSubmittingRef.current || quizFinished) return;
    setAnswers((prev) => ({
      ...prev,
      [activeQuestion.id]: optionIndex,
    }));
  };

  // Submit quiz
  const handleSubmitQuiz = useCallback(async () => {
    if (isSubmittingRef.current || quizFinished || quizQuestions.length === 0) {
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      // Ensure all assigned questions have a numeric value (-1 for unselected)
      const completeAnswers: Record<string, number> = {};
      quizQuestions.forEach((q) => {
        completeAnswers[q.id] =
          typeof answers[q.id] === "number" ? answers[q.id] : -1;
      });

      const result = await dailyQuizService.submitQuiz(completeAnswers);

      if (result.error) {
        setErrorMessage(result.error.message);
        return;
      }

      setScore(result.data.score);
      if (result.data.details) {
        setFeedbackDetails(result.data.details);
      }

      const istToday = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
      }).format(new Date());

      setStreak((prev) => {
        const nextStreakCount = result.data.streakCount;
        const nextBest = Math.max(prev?.bestStreak || 0, nextStreakCount);
        return {
          currentStreak: nextStreakCount,
          bestStreak: nextBest,
          lastCompletedDate: istToday,
        };
      });

      setQuizFinished(true);
      setIsResultModalOpen(true);
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [answers, quizFinished, quizQuestions]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    if (index >= 0 && index < quizQuestions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleResetMock = async () => {
    if (dailyQuizService.resetMockQuiz) {
      await dailyQuizService.resetMockQuiz();
      void loadQuiz();
    }
  };

  // Progress calculation
  const totalAnswered = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== -1,
  ).length;

  const progressPercent =
    quizFinished || quizQuestions.length === 0
      ? 100
      : (totalAnswered / quizQuestions.length) * 100;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-sm text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p>Loading today&apos;s daily quiz...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
        <Card className="border-destructive/40">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              <CardTitle className="text-lg">Unable to Load Quiz</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button onClick={() => void loadQuiz()} className="gap-2">
              <RotateCcw className="size-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // View: Already completed today
  if (alreadyCompletedToday) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-4 p-3 sm:p-4">
        <Card className="border-border bg-card shadow-xs text-center">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                You&apos;re All Caught Up!
              </h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                You have already completed today&apos;s daily quiz and logged your attendance. Come back tomorrow for 5 new questions!
              </p>
            </div>

            {/* Score pill if available */}
            {todaySubmission && (
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3.5 py-1 text-xs font-medium text-foreground">
                <Trophy className="size-3.5 text-amber-500" />
                <span>
                  Today&apos;s Score: {todaySubmission.score} / {todaySubmission.total} (
                  {Math.round((todaySubmission.score / todaySubmission.total) * 100)}%)
                </span>
              </div>
            )}

            {/* Streak metrics */}
            {streak && (
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Current Streak
                  </span>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xl font-bold text-foreground">
                    <Flame className="size-4.5 fill-orange-500 text-orange-500" />
                    <span>
                      {streak.currentStreak}{" "}
                      {streak.currentStreak === 1 ? "Day" : "Days"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Best Streak
                  </span>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xl font-bold text-foreground">
                    <Trophy className="size-4.5 text-amber-500" />
                    <span>
                      {streak.bestStreak}{" "}
                      {streak.bestStreak === 1 ? "Day" : "Days"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              {quizQuestions.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setIsExplanationDrawerOpen(true)}
                  className="h-8 gap-1.5 text-xs"
                >
                  <BookOpen className="size-3.5" /> Review Today&apos;s Questions
                </Button>
              )}

              {isMock && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleResetMock()}
                  className="h-8 gap-1.5 text-xs text-muted-foreground"
                >
                  <RotateCcw className="size-3 text-muted-foreground" /> Practice Again (Reset Mock)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Drawer for reviewing today's questions */}
        <ExplanationDrawer
          isOpen={isExplanationDrawerOpen}
          onClose={() => setIsExplanationDrawerOpen(false)}
          questions={quizQuestions}
          answers={answers}
          feedbackDetails={feedbackDetails}
          score={score}
          total={quizQuestions.length}
        />
      </div>
    );
  }

  // View: No questions available
  if (quizQuestions.length === 0) {
    return (
      <div className="mx-auto w-full max-w-md p-4 text-center">
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-6 space-y-2">
            <h3 className="text-base font-semibold text-foreground">
              No Quiz Questions Available
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No questions are currently available for your enrolled subjects. Make sure you have enrolled in subjects on your dashboard, or generate questions in the Quiz Bank.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 p-3 sm:p-4">
      {/* Sleek compact header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">
            Today&apos;s Questions
          </span>
          <span className="text-xs text-muted-foreground font-normal">
            ({totalAnswered} of {quizQuestions.length} answered)
          </span>
        </div>

        {streak && (
          <StreakBadge
            currentStreak={streak.currentStreak}
            bestStreak={streak.bestStreak}
          />
        )}
      </div>

      {/* Thin Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {quizFinished ? (
        /* Results View */
        <div className="space-y-4">
          <Card className="overflow-hidden border-border bg-card shadow-xs text-center">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {score >= 4 ? (
                  <Trophy className="size-6 text-amber-500 animate-bounce" />
                ) : score >= 3 ? (
                  <CheckCircle2 className="size-6 text-emerald-500" />
                ) : (
                  <Brain className="size-6 text-primary" />
                )}
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">
                  Quiz Completed!
                </h2>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {score >= 4
                    ? "Outstanding job! You have demonstrated a strong mastery of today's topics."
                    : score >= 3
                      ? "Great effort! A solid performance across core concepts."
                      : "Good attempt! Keep reviewing your fundamentals and practice daily."}
                </p>
              </div>

              <div className="my-1 inline-flex flex-col items-center justify-center rounded-xl border border-border bg-muted/40 px-6 py-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Final Score
                </span>
                <span className="mt-0.5 text-3xl font-extrabold text-foreground">
                  {score}{" "}
                  <span className="text-lg font-normal text-muted-foreground">
                    / {quizQuestions.length}
                  </span>
                </span>
                <span className="mt-0.5 text-xs font-medium text-primary">
                  {Math.round((score / quizQuestions.length) * 100)}% Accuracy
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <Button
                  size="sm"
                  onClick={() => setIsExplanationDrawerOpen(true)}
                  className="h-8 gap-1.5 text-xs"
                >
                  <BookOpen className="size-3.5" /> Review Explanations
                </Button>

                {isMock && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleResetMock()}
                    className="h-8 gap-1.5 text-xs text-muted-foreground"
                  >
                    <RotateCcw className="size-3 text-muted-foreground" /> Practice Again (Reset Mock)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : activeQuestion ? (
        /* Active Quiz Player */
        <QuizPlayer
          question={activeQuestion}
          questionIndex={currentQuestionIndex}
          totalQuestions={quizQuestions.length}
          selectedAnswer={selectedAnswer}
          answers={answers}
          questions={quizQuestions}
          onSelectOption={handleSelectOption}
          onNextQuestion={handleNextQuestion}
          onPrevQuestion={handlePrevQuestion}
          onJumpToQuestion={handleJumpToQuestion}
          onSubmitQuiz={() => void handleSubmitQuiz()}
          isSubmitting={submitting}
        />
      ) : null}

      {/* Result celebration modal */}
      <ResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        score={score}
        total={quizQuestions.length}
        streakCount={streak?.currentStreak || 1}
        bestStreak={streak?.bestStreak || 1}
        onViewExplanations={() => setIsExplanationDrawerOpen(true)}
        onPracticeAgain={isMock ? () => void handleResetMock() : undefined}
      />

      {/* Bottom Drawer for question-by-question explanations */}
      <ExplanationDrawer
        isOpen={isExplanationDrawerOpen}
        onClose={() => setIsExplanationDrawerOpen(false)}
        questions={quizQuestions}
        answers={answers}
        feedbackDetails={feedbackDetails}
        score={score}
        total={quizQuestions.length}
      />
    </div>
  );
}
