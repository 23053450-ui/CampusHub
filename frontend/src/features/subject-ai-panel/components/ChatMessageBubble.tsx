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

export function ChatMessageBubble({ message }: { message: UiMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-zinc-700 px-3 py-2 text-sm text-white">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.isError) {
    return (
      <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {message.content}
      </div>
    );
  }

  return (
    <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
      {message.content === "" ? (
        <span className="animate-pulse text-sm text-muted-foreground">Thinking…</span>
      ) : (
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
                <th className="border bg-background px-2 py-1 text-left font-medium">{children}</th>
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
      )}
    </div>
  );
}