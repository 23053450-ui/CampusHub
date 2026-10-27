import { memo, useState } from "react";
import { Check, Copy, Pencil, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { UiMessage } from "../hooks/useChat";

const markdownClasses =
  "text-sm leading-relaxed break-words [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 " +
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-semibold " +
  "[&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold " +
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-background [&_pre]:p-3 " +
  "[&_code]:rounded [&_code]:bg-background [&_code]:px-1 [&_code]:text-xs " +
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_a]:underline [&>*:first-child]:mt-0";

const actionClasses =
  "flex size-6 items-center justify-center rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked: nothing to do
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy"}
      title={copied ? "Copied" : "Copy"}
      className={actionClasses}
    >
      {copied ? (
        <Check className="size-3.5 text-green-600 dark:text-green-400" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

type Props = {
  message: UiMessage;
  streaming?: boolean; // this bubble is still being written
  onRegenerate?: () => void; // only passed to the last message
  onEdit?: (newContent: string) => void;
};

function ChatMessageBubbleImpl({ message, streaming, onRegenerate, onEdit }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  if (message.role === "user") {
    if (isEditing) {
      return (
        <div className="flex justify-end">
          <div className="w-full max-w-[85%] rounded-2xl border border-zinc-300 bg-background p-2.5 shadow-sm dark:border-zinc-700">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full resize-none bg-transparent text-sm outline-none"
              rows={Math.min(editText.split("\n").length + 1, 6)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (editText.trim() && editText.trim() !== message.content) {
                    onEdit?.(editText.trim());
                    setIsEditing(false);
                  }
                } else if (e.key === "Escape") {
                  setIsEditing(false);
                  setEditText(message.content);
                }
              }}
            />
            <div className="mt-2 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditText(message.content);
                }}
                className="rounded px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editText.trim() && editText.trim() !== message.content) {
                    onEdit?.(editText.trim());
                    setIsEditing(false);
                  }
                }}
                disabled={!editText.trim() || editText.trim() === message.content}
                className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-white hover:bg-zinc-700 disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="group flex items-end justify-end gap-1.5">
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                setEditText(message.content);
                setIsEditing(true);
              }}
              aria-label="Edit question"
              title="Edit question"
              className={actionClasses}
            >
              <Pencil className="size-3.5" />
            </button>
          )}
          <CopyButton text={message.content} />
        </div>
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm border border-zinc-300/70 bg-zinc-200 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.isError) {
    return (
      <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
        <p>{message.content}</p>
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            className="mt-1.5 flex items-center gap-1 rounded border border-current px-2 py-0.5 text-xs hover:bg-red-100 dark:hover:bg-red-900"
          >
            <RefreshCw className="size-3" />
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
      {message.content === "" ? (
        <span className="animate-pulse text-sm text-muted-foreground">Thinking…</span>
      ) : (
        <>
          <div className={markdownClasses}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children }) => (
                  <div className="my-2 overflow-x-auto">
                    <table className="w-full border-collapse text-xs">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border bg-background px-2 py-1 text-left font-medium">
                    {children}
                  </th>
                ),
                td: ({ children }) => <td className="border px-2 py-1 align-top">{children}</td>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noreferrer noopener">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {!streaming && (
            <div className="mt-1 flex items-center gap-1">
              <CopyButton text={message.content} />
              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  aria-label="Regenerate answer"
                  title="Regenerate"
                  className={actionClasses}
                >
                  <RefreshCw className="size-3.5" />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Old messages keep the same props between renders, so memo lets React skip them
export const ChatMessageBubble = memo(ChatMessageBubbleImpl);
