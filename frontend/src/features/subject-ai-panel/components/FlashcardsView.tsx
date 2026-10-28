import { useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RotateCw,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateFlashcards,
  type GeneratedFlashcard,
  type GeneratedFlashcardDeck,
} from "../services/studyTools";

interface Props {
  subjectId: string;
  subjectName?: string;
  selectedMaterialIds: string[];
  deck: GeneratedFlashcardDeck | null;
  onDeckGenerated: (deck: GeneratedFlashcardDeck) => void;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Could not generate flashcards. Please try again.";
}

export function FlashcardsView({
  subjectId,
  subjectName,
  selectedMaterialIds,
  deck,
  onDeckGenerated,
}: Props) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("10");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledCards, setShuffledCards] =
    useState<GeneratedFlashcard[] | null>(null);

  const cards = shuffledCards ?? deck?.cards ?? [];
  const currentCard = cards[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShuffledCards(null);
  }, [deck]);

  async function handleGenerate() {
    if (isGenerating) return;

    if (selectedMaterialIds.length === 0) {
      setError("Select at least one study material above.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const generatedDeck = await generateFlashcards({
        subjectId,
        materialIds: selectedMaterialIds,
        topic,
        count: Number(count),
      });

      onDeckGenerated(generatedDeck);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShuffledCards(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  }

  function handleNext() {
    setIsFlipped(false);
    setCurrentIndex((previous) => (previous + 1) % cards.length);
  }

  function handlePrevious() {
    setIsFlipped(false);
    setCurrentIndex((previous) =>
      (previous - 1 + cards.length) % cards.length,
    );
  }

  function handleShuffle() {
    setIsFlipped(false);
    setShuffledCards(
      [...cards].sort(() => Math.random() - 0.5),
    );
    setCurrentIndex(0);
  }

  function handleFlip() {
    setIsFlipped((previous) => !previous);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      {/* Generation controls */}
      <section className="shrink-0 space-y-3 border-b p-3">
        <div>
          <h3 className="text-sm font-semibold">
            {deck ? deck.title : "Generate Flashcards"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {subjectName ?? "Current Subject"}
          </p>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="flashcard-topic"
            className="text-xs font-medium"
          >
            Topic (optional)
          </label>
          <input
            id="flashcard-topic"
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
              htmlFor="flashcard-count"
              className="text-xs font-medium"
            >
              Number of cards
            </label>
            <select
              id="flashcard-count"
              value={count}
              onChange={(event) => setCount(event.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-xs"
            >
              <option value="5">5 cards</option>
              <option value="10">10 cards</option>
              <option value="15">15 cards</option>
              <option value="20">20 cards</option>
              <option value="30">30 cards</option>
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
            {isGenerating ? "Generating…" : deck ? "Generate Again" : "Generate"}
          </Button>
        </div>

        {selectedMaterialIds.length === 0 && (
          <p className="text-[11px] text-muted-foreground">
            Select at least one file in Study materials above.
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Empty state */}
      {!deck && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <Sparkles className="size-8 text-muted-foreground" />
          <h4 className="text-sm font-medium">
            Your flashcards will appear here
          </h4>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            Select study materials, optionally enter a topic, and generate
            cards based on your notes.
          </p>
        </div>
      )}

      {/* Generated cards */}
      {deck && currentCard && (
        <>
          <div className="flex items-center justify-between px-3 pb-2 pt-3">
            <span className="truncate text-xs text-muted-foreground">
              {deck.title}
            </span>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={handleShuffle}
                title="Shuffle cards"
                disabled={cards.length < 2}
              >
                <Shuffle className="size-3.5" />
              </Button>
              <span>
                {currentIndex + 1} / {cards.length}
              </span>
            </div>
          </div>

          <div className="mx-3 mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / cards.length) * 100}%`,
              }}
            />
          </div>

          <div className="flex flex-1 flex-col justify-center p-3">
            <button
              type="button"
              onClick={handleFlip}
              className="flex min-h-[220px] w-full flex-col justify-between rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">
                  {isFlipped ? "Answer" : "Question"}
                </span>
                <span className="flex items-center gap-1">
                  <RotateCw className="size-3.5" />
                  Click to flip
                </span>
              </div>

              <p className="whitespace-pre-line py-5 text-base font-medium leading-relaxed text-foreground">
                {isFlipped ? currentCard.answer : currentCard.question}
              </p>

              <span className="text-right text-[11px] text-muted-foreground">
                {isFlipped
                  ? "Click to see question"
                  : "Click to reveal answer"}
              </span>
            </button>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 p-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={cards.length < 2}
              className="gap-1 text-xs"
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleFlip}
              className="gap-1 text-xs"
            >
              <RotateCw className="size-3.5" />
              Flip
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={cards.length < 2}
              className="gap-1 text-xs"
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}