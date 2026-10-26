import { useEffect, useRef } from "react";
import { Bot, Trash2 } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { ChatInput } from "./ChatInput";
import { ChatMessageBubble } from "./ChatMessageBubble";

// Change this to whatever the chatbot should be called
const BOT_NAME = "Study Assistant";

export function ChatPanel({
  subjectId,
  subjectName,
}: {
  subjectId: string;
  subjectName?: string;
}) {
  const { messages, isStreaming, send, stop, clear } = useChat(subjectId, subjectName);

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true); // only follow new text if the reader is at the bottom

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  // Scroll ONLY the message list, never the page
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function handleSend(text: string) {
    stickRef.current = true;
    void send(text);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-10 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">{BOT_NAME}</h2>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              stickRef.current = true;
              clear();
            }}
            aria-label="Clear conversation"
            className="rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </header>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2"
      >
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Ask a question about this subject to get started.
          </p>
        ) : (
          messages.map((m) => <ChatMessageBubble key={m.id} message={m} />)
        )}
      </div>

      <ChatInput isStreaming={isStreaming} onSend={handleSend} onStop={stop} />
    </div>
  );
}