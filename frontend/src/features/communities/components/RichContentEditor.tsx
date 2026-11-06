/**
 * @file RichContentEditor.tsx
 * @description Compact and feature-stripped rich formatting editor for posts and comments.
 * @owner Communities Team
 */

import React, { useRef, useState } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  PenLine,
  Eye,
} from "lucide-react";
import { FormattedText } from "./FormattedText";

interface RichContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
  minHeight?: string;
  className?: string;
  autoFocus?: boolean;
  footer?: React.ReactNode;
  attachments?: React.ReactNode;
}

export function RichContentEditor({
  value,
  onChange,
  placeholder = "Write your thoughts...",
  compact = false,
  minHeight = compact ? "min-h-[56px]" : "min-h-[140px]",
  className = "",
  autoFocus = false,
  footer,
  attachments,
}: RichContentEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to wrap or insert formatting
  const applyFormat = (prefix: string, suffix: string = "", defaultText: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const replacement = selectedText
      ? `${prefix}${selectedText}${suffix}`
      : `${prefix}${defaultText}${suffix}`;

    const updated = value.substring(0, start) + replacement + value.substring(end);
    onChange(updated);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText
        ? start + replacement.length
        : start + prefix.length;
      textarea.setSelectionRange(
        newCursorPos,
        selectedText ? newCursorPos : newCursorPos + defaultText.length
      );
    }, 0);
  };

  const applyLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const beforeCursor = value.substring(0, start);
    const lastNewline = beforeCursor.lastIndexOf("\n");
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    const nextNewline = value.indexOf("\n", lineStart);
    const lineEnd = nextNewline === -1 ? value.length : nextNewline;
    const currentLine = value.substring(lineStart, lineEnd);

    // If current line already has this exact prefix, toggle it off
    if (currentLine.startsWith(prefix)) {
      const stripped = currentLine.substring(prefix.length);
      const updated = value.substring(0, lineStart) + stripped + value.substring(lineEnd);
      onChange(updated);
      setTimeout(() => {
        textarea.focus();
        const newPos = Math.max(lineStart, start - prefix.length);
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
      return;
    }

    // If current line starts with another marker (different list, heading, quote), replace it
    const markerMatch = currentLine.match(/^(\s*)([-*+]\s+|\d+\.\s+|>\s*|#{1,6}\s+)/);
    if (markerMatch) {
      const oldMarker = markerMatch[0];
      const stripped = currentLine.substring(oldMarker.length);
      const updated = value.substring(0, lineStart) + prefix + stripped + value.substring(lineEnd);
      onChange(updated);
      setTimeout(() => {
        textarea.focus();
        const newPos = Math.max(lineStart, start - oldMarker.length + prefix.length);
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
      return;
    }

    // Otherwise, prepend the prefix
    const updated =
      value.substring(0, lineStart) + prefix + currentLine + value.substring(lineEnd);

    onChange(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // IME safety: do not intercept composition keys (e.g. Japanese/Chinese IME conversion Enter)
    if (e.nativeEvent.isComposing || e.keyCode === 229) {
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      applyFormat("**", "**", "bold");
      return;
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      applyFormat("*", "*", "italic");
      return;
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      applyFormat("[", "](https://example.com)", "link text");
      return;
    }

    // Auto-continuation for lists & quotes on Enter
    if (e.key === "Enter" && !e.shiftKey) {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd } = textarea;
      // If user has highlighted a range of text, let default Enter overwrite selection
      if (selectionStart !== selectionEnd) {
        return;
      }

      const textBefore = value.substring(0, selectionStart);
      const textAfter = value.substring(selectionEnd);
      const lastNewline = textBefore.lastIndexOf("\n");
      const currentLine = textBefore.substring(lastNewline + 1);

      // 1. Unordered bullet list: - item, * item, + item
      const bulletMatch = currentLine.match(/^(\s*)([-*+])\s+(.*)$/);
      if (bulletMatch) {
        e.preventDefault();
        const [, indent, marker, rest] = bulletMatch;

        // If the bullet item is empty (user hit Enter on empty bullet), exit list
        if (!rest.trim()) {
          const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
          const updated = value.substring(0, lineStart) + textAfter;
          onChange(updated);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
          return;
        }

        // Continue bullet list
        const continuation = `\n${indent}${marker} `;
        const updated = textBefore + continuation + textAfter;
        onChange(updated);
        const newCursor = selectionStart + continuation.length;
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newCursor, newCursor);
        }, 0);
        return;
      }

      // 2. Ordered numbered list: 1. item, 2. item, etc.
      const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (numberMatch) {
        e.preventDefault();
        const [, indent, numStr, rest] = numberMatch;

        // If the numbered item is empty, exit list
        if (!rest.trim()) {
          const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
          const updated = value.substring(0, lineStart) + textAfter;
          onChange(updated);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
          return;
        }

        // Continue numbered list with next number
        const nextNum = parseInt(numStr, 10) + 1;
        const continuation = `\n${indent}${nextNum}. `;
        const updated = textBefore + continuation + textAfter;
        onChange(updated);
        const newCursor = selectionStart + continuation.length;
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newCursor, newCursor);
        }, 0);
        return;
      }

      // 3. Blockquote: > quote
      const quoteMatch = currentLine.match(/^(\s*>\s*)(.*)$/);
      if (quoteMatch) {
        e.preventDefault();
        const [, quotePrefix, rest] = quoteMatch;

        // If quote is empty, exit quote block
        if (!rest.trim()) {
          const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
          const updated = value.substring(0, lineStart) + textAfter;
          onChange(updated);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
          return;
        }

        const continuation = `\n${quotePrefix}`;
        const updated = textBefore + continuation + textAfter;
        onChange(updated);
        const newCursor = selectionStart + continuation.length;
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newCursor, newCursor);
        }, 0);
        return;
      }
    }
  };

  return (
    <div
      className={`rounded-xl border border-input bg-card focus-within:ring-1 focus-within:ring-primary/40 focus-within:border-primary/50 transition-all flex flex-col overflow-hidden ${className}`}
    >
      {/* GitHub-style Write / Preview Tab Bar */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-2.5 pt-1.5 pb-0 select-none">
        <div className="flex items-center gap-1 -mb-[1px]">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={`flex items-center gap-1.5 rounded-t-md transition-all border-b-2 cursor-pointer ${
              compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
            } ${
              activeTab === "write"
                ? "border-primary text-foreground bg-card shadow-2xs font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium"
            }`}
          >
            <PenLine className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 rounded-t-md transition-all border-b-2 cursor-pointer ${
              compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
            } ${
              activeTab === "preview"
                ? "border-primary text-foreground bg-card shadow-2xs font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium"
            }`}
          >
            <Eye className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor or Preview Body */}
      {activeTab === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={compact ? 2 : 5}
          className={`w-full resize-y bg-transparent p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none leading-relaxed ${minHeight}`}
        />
      ) : (
        <div
          className={`w-full p-3 text-xs sm:text-sm text-foreground overflow-y-auto leading-relaxed select-text ${minHeight}`}
        >
          {value && value.trim() ? (
            <FormattedText content={value} />
          ) : (
            <p className="text-muted-foreground/60 italic text-xs py-1">Nothing to preview</p>
          )}
        </div>
      )}

      {/* Optional attachments preview (shown in both tabs) */}
      {attachments}

      {/* Formatting Action Bar (Active only on Write tab) */}
      {activeTab === "write" && (
        <div
          className={`flex items-center flex-wrap gap-0.5 border-t bg-muted/20 px-2 py-1 text-muted-foreground select-none ${
            compact ? "py-0.5" : "py-1.5"
          }`}
        >
          {/* Heading */}
          <button
            type="button"
            onClick={() => applyLinePrefix("### ")}
            title="Heading"
            className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
          >
            <Heading className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>

          {/* Bold */}
          <button
            type="button"
            onClick={() => applyFormat("**", "**", "bold")}
            title="Bold (Ctrl+B)"
            className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors font-bold cursor-pointer"
          >
            <Bold className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => applyFormat("*", "*", "italic")}
            title="Italic (Ctrl+I)"
            className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors italic cursor-pointer"
          >
            <Italic className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>

          {/* Strikethrough */}
          <button
            type="button"
            onClick={() => applyFormat("~~", "~~", "strikethrough")}
            title="Strikethrough"
            className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
          >
            <Strikethrough className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>

          <span className="mx-1 h-3.5 w-[1px] bg-border/60" />

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => applyLinePrefix("- ")}
            title="Bullet List"
            className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
          >
            <List className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            onClick={() => applyLinePrefix("1. ")}
            title="Numbered List"
            className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
          >
            <ListOrdered className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>

          {/* Quote */}
          <button
            type="button"
            onClick={() => applyLinePrefix("> ")}
            title="Quote"
            className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
          >
            <Quote className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>

          {/* Code / Block */}
          <button
            type="button"
            onClick={() => applyFormat("`", "`", "code")}
            title="Code"
            className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
          >
            <Code className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>

          {/* Link */}
          <button
            type="button"
            onClick={() => applyFormat("[", "](https://example.com)", "link text")}
            title="Insert Link"
            className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
          >
            <LinkIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>
        </div>
      )}

      {/* Optional bottom footer (cancel/save buttons & controls) */}
      {footer && (
        <div className="border-t bg-muted/10 px-3 py-1.5 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}
