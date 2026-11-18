/**
 * @file QuizBankAdminPage.tsx
 * @description Admin & Moderator page to inspect existing quiz questions and generate
 *              new questions from approved community notes/PYQs using the Gemini AI API.
 * @owner Platform Admin Team
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Trash2,
  Loader2,
  FileText,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { quizBankService } from "./services/quizBank";
import type {
  ExistingQuizQuestion,
  GeneratedQuizQuestion,
  SubjectNoteSummary,
} from "./services/quizBank";

export const QuizBankAdminPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; code?: string }>>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"generate" | "pool">("generate");

  // Community notes for selected subject
  const [notes, setNotes] = useState<SubjectNoteSummary[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  // Existing pool questions
  const [existingQuestions, setExistingQuestions] = useState<ExistingQuizQuestion[]>([]);
  const [isLoadingPool, setIsLoadingPool] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<ExistingQuizQuestion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Generator inputs
  const [topicFocus, setTopicFocus] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generated draft questions to review
  const [draftQuestions, setDraftQuestions] = useState<GeneratedQuizQuestion[]>([]);
  const [isApproving, setIsApproving] = useState(false);

  // 1. Load subjects on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingSubjects(true);
    quizBankService.getSubjects().then((res) => {
      if (!isMounted) return;
      if (res.data && res.data.length > 0) {
        setSubjects(res.data);
        setSelectedSubjectId(res.data[0].id);
      }
      setIsLoadingSubjects(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load notes & existing questions when selectedSubjectId changes
  const loadSubjectData = useCallback(async (subjectId: string) => {
    if (!subjectId) return;

    setIsLoadingNotes(true);
    setIsLoadingPool(true);
    setDraftQuestions([]);
    setSelectedNoteIds([]);

    const [notesRes, poolRes] = await Promise.all([
      quizBankService.getApprovedNotes(subjectId),
      quizBankService.getExistingQuestions(subjectId),
    ]);

    if (notesRes.data) {
      setNotes(notesRes.data);
      // Auto-select first note if available
      if (notesRes.data.length > 0) {
        setSelectedNoteIds([notesRes.data[0].id]);
      }
    } else {
      setNotes([]);
    }
    setIsLoadingNotes(false);

    if (poolRes.data) {
      setExistingQuestions(poolRes.data);
    } else {
      setExistingQuestions([]);
    }
    setIsLoadingPool(false);
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      void loadSubjectData(selectedSubjectId);
    }
  }, [selectedSubjectId, loadSubjectData]);

  // Toggle note selection
  const handleToggleNote = (noteId: string) => {
    setSelectedNoteIds((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : prev.length >= 5
          ? (toast.error("You can select up to 5 notes at once."), prev)
          : [...prev, noteId],
    );
  };

  // Trigger AI Question Generation
  const handleGenerate = async () => {
    if (selectedNoteIds.length === 0) {
      toast.error("Please select at least one study note or PYQ.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await quizBankService.generateQuestions({
        subjectId: selectedSubjectId,
        noteIds: selectedNoteIds,
        topic: topicFocus.trim() || undefined,
        count: questionCount,
        difficulty,
      });

      if (res.error) {
        toast.error(res.error.message);
        return;
      }

      if (res.data && res.data.questions.length > 0) {
        setDraftQuestions(res.data.questions);
        toast.success(`Generated ${res.data.questions.length} questions! Review below.`);
      } else {
        toast.error("No questions were generated. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Edit draft question fields
  const handleUpdateDraft = (
    tempId: string,
    field: keyof GeneratedQuizQuestion,
    value: any,
  ) => {
    setDraftQuestions((prev) =>
      prev.map((q) => (q.tempId === tempId ? { ...q, [field]: value } : q)),
    );
  };

  // Edit draft option text
  const handleUpdateOption = (tempId: string, optIndex: number, text: string) => {
    setDraftQuestions((prev) =>
      prev.map((q) => {
        if (q.tempId !== tempId) return q;
        const newOptions = [...q.options];
        newOptions[optIndex] = text;
        return { ...q, options: newOptions };
      }),
    );
  };

  // Discard draft question
  const handleDiscardDraft = (tempId: string) => {
    setDraftQuestions((prev) => prev.filter((q) => q.tempId !== tempId));
  };

  // Approve all or remaining draft questions
  const handleApproveAll = async () => {
    if (draftQuestions.length === 0) return;

    setIsApproving(true);
    try {
      const payloads = draftQuestions.map((q) => ({
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        difficulty: q.difficulty,
        topic: q.topic,
        sourceSnippet: `Generated from ${selectedNoteIds.length} approved note(s)`,
      }));

      const res = await quizBankService.approveQuestions(selectedSubjectId, payloads);

      if (res.error) {
        toast.error(res.error.message);
        return;
      }

      toast.success(
        `Successfully approved and added ${res.data.inserted} questions to the daily quiz pool!`,
      );
      setDraftQuestions([]);
      setActiveTab("pool");
      void loadSubjectData(selectedSubjectId);
    } finally {
      setIsApproving(false);
    }
  };

  // Delete question from pool
  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;

    setIsDeleting(true);
    try {
      const res = await quizBankService.deleteQuestion(questionToDelete.id);
      if (res.error) {
        toast.error(res.error.message);
        return;
      }

      toast.success("Question removed from pool.");
      setExistingQuestions((prev) => prev.filter((q) => q.id !== questionToDelete.id));
      setQuestionToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Daily Quiz Bank & AI Generator
            </h1>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
              Staff Portal
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate exam-level daily questions from verified community notes using Gemini, or manage the current question pool.
          </p>
        </div>

        {/* Subject Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Subject:
          </span>
          <Select
            value={selectedSubjectId}
            onValueChange={setSelectedSubjectId}
            disabled={isLoadingSubjects}
          >
            <SelectTrigger className="w-56 bg-card">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name} {sub.code ? `(${sub.code})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("generate")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "generate"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="size-4" />
          <span>Generate with AI</span>
          {draftQuestions.length > 0 && (
            <Badge className="ml-1.5 h-5 px-1.5 text-xs bg-amber-500 text-white">
              {draftQuestions.length} draft
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pool")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "pool"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="size-4" />
          <span>Active Question Pool</span>
          <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
            {existingQuestions.length}
          </Badge>
        </button>
      </div>

      {/* Tab 1: AI Generator */}
      {activeTab === "generate" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left: Notes Picker */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      1. Select Source Notes / PYQs
                    </CardTitle>
                    <CardDescription>
                      Choose approved study materials from {selectedSubject?.name || "this community"} to ground questions.
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {selectedNoteIds.length} / 5 selected
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoadingNotes ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin mr-2" />
                    <span>Loading community notes...</span>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    <FileText className="mx-auto size-8 text-muted-foreground/60 mb-2" />
                    No approved notes found for this subject yet.
                    <p className="text-xs mt-1">Upload and approve notes in the community first.</p>
                  </div>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {notes.map((note) => {
                      const isSelected = selectedNoteIds.includes(note.id);
                      return (
                        <div
                          key={note.id}
                          onClick={() => handleToggleNote(note.id)}
                          className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-xs"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="size-4 rounded accent-primary shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {note.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Added {new Date(note.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {note.tag}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: Generation Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  2. Tuning Parameters
                </CardTitle>
                <CardDescription>
                  Configure difficulty and focus for the Gemini model.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Topic Focus (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Normalization, Deadlocks..."
                    value={topicFocus}
                    onChange={(e) => setTopicFocus(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Difficulty
                  </label>
                  <Select
                    value={difficulty}
                    onValueChange={(val: any) => setDifficulty(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy (Definitions & Syntax)</SelectItem>
                      <SelectItem value="medium">Medium (Standard Conceptual)</SelectItem>
                      <SelectItem value="hard">Hard (Tricky Edge Cases & Math)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Question Count
                  </label>
                  <Select
                    value={questionCount.toString()}
                    onValueChange={(val) => setQuestionCount(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Questions</SelectItem>
                      <SelectItem value="5">5 Questions (Standard)</SelectItem>
                      <SelectItem value="10">10 Questions (Batch)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => void handleGenerate()}
                  disabled={isGenerating || selectedNoteIds.length === 0}
                  className="w-full gap-2 mt-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Analyzing PDF with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4 text-amber-300" />
                      <span>Generate Questions</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Draft Questions Review Section */}
          {draftQuestions.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Review Generated Questions ({draftQuestions.length})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Inspect, edit text or correct answer index before approving into the live pool.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDraftQuestions([])}
                    disabled={isApproving}
                  >
                    Discard All
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void handleApproveAll()}
                    disabled={isApproving || draftQuestions.length === 0}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isApproving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    <span>Approve & Add All ({draftQuestions.length})</span>
                  </Button>
                </div>
              </div>

              {/* List of draft cards */}
              <div className="space-y-4">
                {draftQuestions.map((q, qIndex) => (
                  <Card key={q.tempId} className="border-border">
                    <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {qIndex + 1}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {q.topic}
                          </Badge>
                          <Badge
                            className={`text-xs ${
                              q.difficulty === "easy"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : q.difficulty === "hard"
                                  ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}
                          >
                            {q.difficulty}
                          </Badge>
                        </div>

                        {/* Editable Question Text */}
                        <Input
                          value={q.question}
                          onChange={(e) =>
                            handleUpdateDraft(q.tempId, "question", e.target.value)
                          }
                          className="font-semibold text-foreground text-sm"
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDiscardDraft(q.tempId)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        title="Discard question"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      {/* 4 Options Grid */}
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = q.correctIndex === optIdx;
                          return (
                            <div
                              key={optIdx}
                              onClick={() =>
                                handleUpdateDraft(q.tempId, "correctIndex", optIdx)
                              }
                              className={`flex items-center gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-all ${
                                isCorrect
                                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                                  : "border-border hover:bg-muted/40"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct-${q.tempId}`}
                                checked={isCorrect}
                                onChange={() =>
                                  handleUpdateDraft(q.tempId, "correctIndex", optIdx)
                                }
                                className="accent-emerald-600 shrink-0"
                              />
                              <Input
                                value={opt}
                                onChange={(e) =>
                                  handleUpdateOption(q.tempId, optIdx, e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 text-xs bg-transparent border-transparent hover:border-border focus:border-border"
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                        <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                          Explanation:
                        </span>
                        <Input
                          value={q.explanation}
                          onChange={(e) =>
                            handleUpdateDraft(q.tempId, "explanation", e.target.value)
                          }
                          className="h-8 text-xs bg-card"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Existing Question Pool */}
      {activeTab === "pool" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Active Question Pool for {selectedSubject?.name || selectedSubjectId}
              </h2>
              <p className="text-xs text-muted-foreground">
                These questions are randomly sampled by the deterministic daily quiz algorithm.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadSubjectData(selectedSubjectId)}
              className="gap-2"
            >
              <RefreshCw className="size-3.5" />
              <span>Refresh Pool</span>
            </Button>
          </div>

          {isLoadingPool ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-6 animate-spin mr-2" />
              <span>Loading questions...</span>
            </div>
          ) : existingQuestions.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <HelpCircle className="mx-auto size-10 text-muted-foreground/50 mb-3" />
              <h3 className="font-semibold text-foreground">No questions in this pool</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Use the AI Generator tab to generate questions from community notes.
              </p>
              <Button size="sm" onClick={() => setActiveTab("generate")} className="gap-2">
                <Sparkles className="size-4" />
                <span>Generate Questions Now</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {existingQuestions.map((q, idx) => (
                <Card key={q.id} className="border-border shadow-xs">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">
                            #{idx + 1} ({q.id})
                          </span>
                          {q.topic && <Badge variant="outline" className="text-xs">{q.topic}</Badge>}
                          <Badge
                            variant="secondary"
                            className="text-xs uppercase"
                          >
                            Source: {q.source}
                          </Badge>
                          {q.difficulty && (
                            <Badge
                              className={`text-xs ${
                                q.difficulty === "easy"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : q.difficulty === "hard"
                                    ? "bg-rose-500/10 text-rose-600"
                                    : "bg-amber-500/10 text-amber-600"
                              }`}
                            >
                              {q.difficulty}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {q.question}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuestionToDelete(q)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        title="Remove question"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    {/* Options Preview */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = oIdx === q.correctAnswerIndex;
                        return (
                          <div
                            key={oIdx}
                            className={`rounded-md px-3 py-1.5 border flex items-center justify-between ${
                              isCorrect
                                ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            <span>{opt}</span>
                            {isCorrect && (
                              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 ml-1.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <p className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-2.5 italic">
                        {q.explanation}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={questionToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setQuestionToDelete(null);
        }}
        title="Remove Question from Pool"
        description="Are you sure you want to remove this question? It will no longer be sampled for students in future quizzes."
        confirmText="Remove Question"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={() => void handleDeleteQuestion()}
      />
    </div>
  );
};
