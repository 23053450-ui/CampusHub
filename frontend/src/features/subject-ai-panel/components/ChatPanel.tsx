import { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { ChatInput } from "./ChatInput";
import { ChatMessageBubble } from "./ChatMessageBubble";

export function ChatPanel({ subjectId }: { subjectId: string }) {
  const { messages, isStreaming, send, stop, clear } = useChat(subjectId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-medium">Chat with AI</h2>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear conversation"
            className="rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Ask a question about this subject to get started.
          </p>
        ) : (
          messages.map((m) => <ChatMessageBubble key={m.id} message={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput isStreaming={isStreaming} onSend={send} onStop={stop} />
    </div>
  );
}