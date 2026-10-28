/**
 * @file SubjectAiPanelPage.tsx
 * @description Main view for Subject AI Study Companion Panel feature.
 * @owner Subject AI Panel Team
 */

import { useState } from "react";
import { useParams } from "react-router-dom";
import { Bot } from "lucide-react";
import { ChatBody } from "./components/ChatPanel";
import { FlashcardsView } from "./components/FlashcardsView";
import { QuizView } from "./components/QuizView";
import { StudyMaterialsTray } from "./components/StudyMaterialsTray";
import { useStudyMaterials, MAX_STUDY_MATERIALS } from "./hooks/useStudyMaterials";
import type { GeneratedFlashcardDeck, GeneratedQuiz } from "./services/studyTools";

const BOT_NAME = "Study Assistant";

const TOOLS = [
  { id: "chat", label: "Chat" },
  { id: "flashcards", label: "Flashcards" },
  { id: "quiz", label: "Quiz" },
] as const;

type Tool = (typeof TOOLS)[number]["id"];

export default function SubjectAiPanelPage({ subjectName }: { subjectName?: string }) {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [activeTool, setActiveTool] = useState<Tool>("chat");
  const [selectorVisible, setSelectorVisible] = useState(false);
  const materials = useStudyMaterials(subjectId ?? "");
  const [flashcardDecks, setFlashcardDecks] = useState<Record<string, GeneratedFlashcardDeck>>({});
  const [quizzes, setQuizzes] = useState<Record<string, GeneratedQuiz>>({});
  
  if (!subjectId) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Open a subject to use the AI study companion.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Hover zone contains both the header and its selector. */}
      <div
        onMouseEnter={() => setSelectorVisible(true)}
        onMouseLeave={() => setSelectorVisible(false)}
        className="shrink-0"
      >
        <header className="flex h-10 items-center gap-2 border-b px-3">
          <Bot className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">{BOT_NAME}</h2>
          {activeTool !== "chat" && (
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {TOOLS.find((tool) => tool.id === activeTool)?.label}
            </span>
          )}
        </header>

        <div
          className={`overflow-hidden transition-all duration-200 ease-in-out ${selectorVisible ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <div className="flex items-center gap-0.5 border-b bg-card px-2 py-1">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                aria-pressed={activeTool === tool.id}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${activeTool === tool.id
                    ? "bg-secondary font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                {tool.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <StudyMaterialsTray
        materials={materials.materials}
        isLoading={materials.isLoading}
        uploadingFile={materials.uploadingFile}
        removingId={materials.removingId}
        error={materials.error}
        onAddFiles={(files) => void materials.addFiles(files)}
        onToggle={materials.toggleMaterial}
        onRemove={(id) => void materials.removeMaterial(id)}
        onDismissError={materials.clearError}
      />

      {activeTool === "chat" && (
        <ChatBody
          key={subjectId}
          subjectId={subjectId}
          subjectName={subjectName}
          onAddFiles={(files) => void materials.addFiles(files)}
          isUploadingFiles={materials.isUploading}
          canAddFiles={materials.materials.length < MAX_STUDY_MATERIALS}
        />
      )}

      {activeTool === "flashcards" && (
        <FlashcardsView
        subjectId={subjectId}
        subjectName={subjectName}
        selectedMaterialIds={materials.selectedMaterialIds}
        deck={flashcardDecks[subjectId] ?? null}
        onDeckGenerated={(deck) => {
        setFlashcardDecks((previous) => ({
          ...previous,
          [subjectId]: deck,
          }));
          }}
        />
      )}

    {activeTool === "quiz" && (
      <QuizView
      subjectId={subjectId}
      subjectName={subjectName}
      selectedMaterialIds={materials.selectedMaterialIds}
      quiz={quizzes[subjectId] ?? null}
      onQuizGenerated={(quiz) => {
      setQuizzes((previous) => ({
        ...previous,
        [subjectId]: quiz,
        }));
        }}
      />
    )}

      
    </div>
  );
}
