import React from "react";
import { ArrowLeft, ArrowRight, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "../services";

interface QuizPlayerProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  answers: Record<string, number>;
  questions: QuizQuestion[];
  onSelectOption: (optionIndex: number) => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onJumpToQuestion: (index: number) => void;
  onSubmitQuiz: () => void;
  isSubmitting: boolean;
}

export function QuizPlayer({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  answers,
  questions,
  onSelectOption,
  onNextQuestion,
  onPrevQuestion,
  onJumpToQuestion,
  onSubmitQuiz,
  isSubmitting,
}: QuizPlayerProps) {
  const isLastQuestion = questionIndex === totalQuestions - 1;
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== -1,
  ).length;

  const difficultyColors = {
    easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    medium: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    hard: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  };

  const difficultyKey = (question.difficulty?.toLowerCase() ||
    "medium") as keyof typeof difficultyColors;
  const difficultyBadgeClass =
    difficultyColors[difficultyKey] || difficultyColors.medium;

  return (
    <Card className="border-border bg-card shadow-xs overflow-hidden">
      {/* Question header with metadata & question jumper on a single compact line */}
      <CardHeader className="border-b border-border/70 px-4 py-2.5 sm:px-5 sm:py-3 bg-muted/20">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Badge variant="outline" className="border-border bg-card font-medium text-xs px-2 py-0.5">
              Question {questionIndex + 1} of {totalQuestions}
            </Badge>

            {question.topic && (
              <Badge variant="secondary" className="text-xs font-normal px-2 py-0.5">
                {question.topic}
              </Badge>
            )}

            {question.difficulty && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
                  difficultyBadgeClass,
                )}
              >
                {question.difficulty}
              </span>
            )}
          </div>

          {/* Question jumper tabs/pills inline */}
          <div className="flex items-center gap-1">
            {questions.map((q, idx) => {
              const isCurrent = idx === questionIndex;
              const hasAnswered = answers[q.id] !== undefined && answers[q.id] !== -1;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onJumpToQuestion(idx)}
                  className={cn(
                    "flex size-6.5 sm:size-7 items-center justify-center rounded-md text-xs font-medium transition-all cursor-pointer",
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary/40"
                      : hasAnswered
                        ? "bg-primary/15 text-primary hover:bg-primary/25"
                        : "border border-border/70 bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  title={`Question ${idx + 1}${hasAnswered ? " (Answered)" : ""}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 sm:p-5 space-y-4">
        {/* Question text */}
        <div>
          <h2 className="text-sm sm:text-base font-normal leading-relaxed text-foreground">
            {question.question}
          </h2>
        </div>

        {/* Options list */}
        <div className="space-y-2" role="radiogroup" aria-label="Question options">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const letter = String.fromCharCode(65 + index);

            return (
              <button
                key={`${question.id}-${option}-${index}`}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectOption(index)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-start rounded-lg border px-3 py-2 sm:px-3.5 sm:py-2.5 text-left text-xs sm:text-sm transition-all outline-none",
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground font-medium shadow-2xs ring-1 ring-primary"
                    : "border-border bg-card text-foreground hover:bg-muted/40 hover:border-border/80",
                )}
              >
                <span
                  className={cn(
                    "mr-3 flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-medium transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {letter}
                </span>

                <span className="flex-1 text-xs sm:text-sm leading-snug">{option}</span>

                {isSelected && (
                  <Check className="size-4 shrink-0 text-primary ml-2" />
                )}
              </button>
            );
          })}
        </div>

        {/* Card bottom navigation */}
        <div className="flex items-center justify-between border-t border-border/70 pt-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={questionIndex === 0 || isSubmitting}
              onClick={onPrevQuestion}
              className="h-8 gap-1 text-xs"
            >
              <ArrowLeft className="size-3.5" /> Previous
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {answeredCount} of {totalQuestions} answered
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isLastQuestion ? (
              <Button
                type="button"
                size="sm"
                onClick={onNextQuestion}
                disabled={isSubmitting}
                className="h-8 gap-1 text-xs"
              >
                Next <ArrowRight className="size-3.5" />
              </Button>
            ) : null}

            {/* Show Submit button on last question or anytime all answered */}
            {(isLastQuestion || answeredCount === totalQuestions) && (
              <Button
                type="button"
                size="sm"
                variant={isLastQuestion ? "default" : "secondary"}
                disabled={isSubmitting}
                onClick={onSubmitQuiz}
                className="h-8 gap-1 text-xs"
              >
                <Send className="size-3.5" />
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
