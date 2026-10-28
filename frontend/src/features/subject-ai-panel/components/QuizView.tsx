import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  generateQuiz,
  type GeneratedQuiz,
} from "../services/studyTools";

interface Props {
  subjectId: string;
  subjectName?: string;
  selectedMaterialIds: string[];
  quiz: GeneratedQuiz | null;
  onQuizGenerated: (quiz: GeneratedQuiz) => void;
}

export function QuizView({
  subjectId,
  subjectName,
  selectedMaterialIds,
  quiz,
  onQuizGenerated,
}: Props) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("10");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const questions = quiz?.questions ?? [];
  const currentQ = questions[currentIndex];
  const hasAnswered = selectedOption !== null;

  // Start a fresh attempt when a new quiz is generated.
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  }, [quiz]);

  async function handleGenerate() {
    if (isGenerating) return;

    if (selectedMaterialIds.length === 0) {
      setGenerationError("Select at least one study material above.");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const generated = await generateQuiz({
        subjectId,
        materialIds: selectedMaterialIds,
        topic,
        count: Number(count),
      });

      onQuizGenerated(generated);
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Could not generate the quiz. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSelectOption(index: number) {
    if (hasAnswered || !currentQ) return;

    setSelectedOption(index);

    if (index === currentQ.correctIndex) {
      setScore((previous) => previous + 1);
    }
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((previous) => previous + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  }

  function handleRestart() {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  }

  const percentage =
    questions.length > 0
      ? Math.round((score / questions.length) * 100)
      : 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      {/* Quiz generation controls */}
      <section className="shrink-0 space-y-3 border-b p-3">
        <div>
          <h3 className="text-sm font-semibold">
            {quiz?.title ?? "Generate Practice Quiz"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {subjectName ?? "Current Subject"}
          </p>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="quiz-topic"
            className="text-xs font-medium"
          >
            Topic (optional)
          </label>

          <input
            id="quiz-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            maxLength={150}
            placeholder="e.g. Normalization, SQL, Transactions"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <label
              htmlFor="quiz-count"
              className="text-xs font-medium"
            >
              Number of questions
            </label>

            <select
              id="quiz-count"
              value={count}
              onChange={(event) => setCount(event.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-xs"
            >
              <option value="5">5 questions</option>
              <option value="10">10 questions</option>
              <option value="15">15 questions</option>
              <option value="20">20 questions</option>
            </select>
          </div>

          <Button
            onClick={() => void handleGenerate()}
            disabled={isGenerating || selectedMaterialIds.length === 0}
            className="h-9 gap-1.5 text-xs"
          >
            {isGenerating ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}

            {isGenerating
              ? "Generating..."
              : quiz
                ? "Generate Again"
                : "Generate Quiz"}
          </Button>
        </div>

        {selectedMaterialIds.length === 0 && (
          <p className="text-[11px] text-muted-foreground">
            Select at least one file in Study materials above.
          </p>
        )}

        {generationError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span>{generationError}</span>
          </div>
        )}
      </section>

      {/* Empty state before the first quiz */}
      {!quiz && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <HelpCircle className="size-8 text-muted-foreground" />

          <h4 className="text-sm font-medium">
            Your practice quiz will appear here
          </h4>

          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            Select your study materials, optionally specify a topic,
            and generate questions from your notes.
          </p>
        </div>
      )}

      {/* Completion screen */}
      {quiz && isFinished && (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-8" />
          </div>

          <h3 className="text-base font-semibold">
            Quiz Completed!
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            {subjectName ?? "Study Subject"}
          </p>

          <div className="my-5 rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-2xl font-bold text-foreground">
              {score} / {questions.length}
            </p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {percentage}% correct
            </p>
          </div>

          <Button onClick={handleRestart} className="gap-2 text-xs">
            <RotateCcw className="size-3.5" />
            Retake Quiz
          </Button>
        </div>
      )}

      {/* Active quiz */}
      {quiz && !isFinished && currentQ && (
        <>
          <div className="flex items-center justify-between px-3 pb-2 pt-3">
            <span className="truncate text-xs text-muted-foreground">
              {quiz.title}
            </span>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HelpCircle className="size-3.5" />
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
          </div>

          <div className="mx-3 mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>

          <div className="space-y-3 px-3 pb-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm font-medium leading-relaxed text-foreground">
                {currentQ.question}
              </p>
            </div>

            <div className="space-y-2">
              {currentQ.options.map((option, index) => {
                const isSelected = selectedOption === index;
                const isCorrect = index === currentQ.correctIndex;

                let optionStyle =
                  "border-border bg-card hover:bg-muted/60 text-foreground";

                if (hasAnswered) {
                  if (isCorrect) {
                    optionStyle =
                      "border-emerald-500 bg-emerald-500/10 text-foreground font-medium";
                  } else if (isSelected) {
                    optionStyle =
                      "border-destructive bg-destructive/10 text-destructive font-medium";
                  } else {
                    optionStyle =
                      "border-border/60 opacity-60 text-muted-foreground";
                  }
                }

                return (
                  <button
                    key={`${currentIndex}-${index}`}
                    type="button"
                    disabled={hasAnswered}
                    onClick={() => handleSelectOption(index)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-left text-xs transition-all",
                      optionStyle,
                      hasAnswered && "cursor-default",
                    )}
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold text-muted-foreground">
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span className="flex-1 leading-snug">
                      {option}
                    </span>

                    {hasAnswered && isCorrect && (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    )}

                    {hasAnswered && isSelected && !isCorrect && (
                      <XCircle className="size-4 shrink-0 text-destructive" />
                    )}
                  </button>
                );
              })}
            </div>

            {hasAnswered && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
                <p className="mb-1 font-semibold text-foreground">
                  {selectedOption === currentQ.correctIndex
                    ? "Correct!"
                    : "Explanation"}
                </p>

                <p className="leading-relaxed text-muted-foreground">
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {hasAnswered && (
              <div className="flex justify-end pt-1">
                <Button
                  onClick={handleNext}
                  size="sm"
                  className="gap-1.5 text-xs"
                >
                  {currentIndex < questions.length - 1
                    ? "Next Question"
                    : "Finish Quiz"}

                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}