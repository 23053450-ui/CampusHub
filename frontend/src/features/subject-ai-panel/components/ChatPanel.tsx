import { useEffect, useRef, useState } from "react";
import { ArrowDown, Trash2 } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { ChatInput } from "./ChatInput";
import { ChatMessageBubble } from "./ChatMessageBubble";

interface ChatBodyProps {
  subjectId: string;
  subjectName?: string;
  onAddFiles?: (files: File[]) => void;
  isUploadingFiles?: boolean;
  canAddFiles?: boolean;
}

/**
 * The scrollable message list + input bar for the Chat tool.
 * The shared Study Assistant header and study-material tray live in SubjectAiPanelPage.
 */
export function ChatBody({
  subjectId,
  subjectName,
  onAddFiles,
  isUploadingFiles,
  canAddFiles,
}: ChatBodyProps) {
  const { messages, isStreaming, send, regenerate, edit, stop, clear } = useChat(
    subjectId,
    subjectName,
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stickRef.current = nearBottom;
    setShowJump(!nearBottom);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function jumpToLatest() {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }

  function handleSend(text: string) {
    stickRef.current = true;
    void send(text);
  }

  function handleRegenerate() {
    stickRef.current = true;
    void regenerate();
  }

  const starters = [
    `What are the key topics in ${subjectName ?? "this subject"}?`,
    "Explain the hardest concept with a simple example",
    "Quiz me with 3 short questions",
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {messages.length > 0 && (
        <div className="flex shrink-0 justify-end border-b px-2 py-0.5">
          <button
            type="button"
            onClick={() => {
              stickRef.current = true;
              setShowJump(false);
              clear();
            }}
            aria-label="Clear conversation"
            className="rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full space-y-3 overflow-y-auto px-3 py-2"
        >
          {messages.length === 0 ? (
            <div className="mt-6 space-y-2">
              <p className="text-center text-sm text-muted-foreground">
                Ask a question, or try one of these:
              </p>
              {starters.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  {q}
                </button>
              ))}
            </div>
          ) : (
            messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              return (
                <ChatMessageBubble
                  key={m.id}
                  message={m}
                  streaming={isLast && isStreaming}
                  onRegenerate={isLast && !isStreaming ? handleRegenerate : undefined}
                  onEdit={
                    m.role === "user" && !isStreaming
                      ? (text) => void edit(m.id, text)
                      : undefined
                  }
                />
              );
            })
          )}
        </div>

        {showJump && messages.length > 0 && (
          <button
            type="button"
            onClick={jumpToLatest}
            aria-label="Jump to latest"
            title="Jump to latest"
            className="absolute bottom-2 left-1/2 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border border-zinc-500/80 bg-zinc-400 text-zinc-900 shadow-md transition-colors hover:bg-zinc-500 hover:text-white dark:border-zinc-500 dark:bg-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-500"
          >
            <ArrowDown className="size-4" />
          </button>
        )}
      </div>

      <ChatInput
        isStreaming={isStreaming}
        onSend={handleSend}
        onStop={stop}
        onAddFiles={onAddFiles}
        isUploadingFiles={isUploadingFiles}
        canAddFiles={canAddFiles}
      />
    </div>
  );
}

// Keep the old ChatPanel export so nothing outside this feature breaks.
export { ChatBody as ChatPanel };
