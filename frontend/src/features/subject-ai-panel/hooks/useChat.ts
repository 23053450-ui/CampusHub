import { useCallback, useEffect, useRef, useState } from "react";
import { ChatApiError, streamChat, type ChatMessage } from "../services/chat";

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
};

const MAX_HISTORY = 20;

// What we send to the backend: no error bubbles, no empty bubbles,
// roles alternating, starting with a user message, capped in length.
function buildHistory(messages: UiMessage[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const m of messages) {
    if (m.isError || !m.content) continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role) {
      out[out.length - 1] = { role: m.role, content: m.content };
    } else {
      out.push({ role: m.role, content: m.content });
    }
  }
  const trimmed = out.slice(-MAX_HISTORY);
  while (trimmed.length > 0 && trimmed[0].role !== "user") trimmed.shift();
  return trimmed;
}

function friendlyError(e: unknown): string {
  if (e instanceof ChatApiError) {
    if (e.status === 429) {
      return e.retryAfterSeconds
        ? `You're sending messages too fast. Try again in ${e.retryAfterSeconds}s.`
        : "You're sending messages too fast. Please wait a moment.";
    }
    if (e.status === 401) return "Your session has expired. Please log in again.";
    return e.message;
  }
  return "Couldn't reach the server. Check your connection and try again.";
}

export function useChat(subjectId: string, subjectName?: string) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight request if the panel unmounts
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isStreaming) return;

      const userMsg: UiMessage = { id: crypto.randomUUID(), role: "user", content };
      const botId = crypto.randomUUID();
      const history = buildHistory([...messages, userMsg]);

      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: botId, role: "assistant", content: "" },
      ]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const patchBot = (fn: (m: UiMessage) => UiMessage) =>
        setMessages((prev) => prev.map((m) => (m.id === botId ? fn(m) : m)));

      try {
        for await (const ev of streamChat({
          subjectId,
          subjectName,
          messages: history,
          signal: controller.signal,
        })) {
          if (ev.type === "token") {
            patchBot((m) => ({ ...m, content: m.content + ev.text }));
          } else if (ev.type === "error") {
            patchBot((m) => ({ ...m, content: ev.message, isError: true }));
          }
        }
      } catch (e) {
        if (controller.signal.aborted) {
          // User pressed Stop: keep what arrived, drop the bubble if it's empty
          setMessages((prev) => prev.filter((m) => !(m.id === botId && m.content === "")));
        } else {
          patchBot((m) => ({ ...m, content: friendlyError(e), isError: true }));
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, subjectId,subjectName],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
  }, []);

  return { messages, isStreaming, send, stop, clear };
}