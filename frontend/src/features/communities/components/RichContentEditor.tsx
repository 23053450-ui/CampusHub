/**
 * @file RichContentEditor.tsx
 * @description Compact and feature-stripped rich formatting editor for posts and comments.
 * @owner Communities Team
 */

import React, { useRef } from "react";
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
} from "lucide-react";

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
    const beforeCursor = value.substring(0, start);
    const lastNewline = beforeCursor.lastIndexOf("\n");

    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    const updated =
      value.substring(0, lineStart) + prefix + value.substring(lineStart);

    onChange(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      applyFormat("**", "**", "bold");
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      applyFormat("*", "*", "italic");
    }
  };

  return (
    <div
      className={`rounded-xl border border-input bg-card focus-within:ring-1 focus-within:ring-primary/40 focus-within:border-primary/50 transition-all flex flex-col overflow-hidden ${className}`}
    >
      {/* Editor Textarea */}
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

      {/* Optional attachments preview */}
      {attachments}

      {/* Formatting Action Bar */}
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
          className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
        >
          <Heading className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>

        {/* Bold */}
        <button
          type="button"
          onClick={() => applyFormat("**", "**", "bold")}
          title="Bold (Ctrl+B)"
          className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors font-bold"
        >
          <Bold className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => applyFormat("*", "*", "italic")}
          title="Italic (Ctrl+I)"
          className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors italic"
        >
          <Italic className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onClick={() => applyFormat("~~", "~~", "strikethrough")}
          title="Strikethrough"
          className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
        >
          <Strikethrough className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>

        <span className="mx-1 h-3.5 w-[1px] bg-border/60" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => applyLinePrefix("- ")}
          title="Bullet List"
          className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
        >
          <List className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onClick={() => applyLinePrefix("1. ")}
          title="Numbered List"
          className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
        >
          <ListOrdered className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>

        {/* Quote */}
        <button
          type="button"
          onClick={() => applyLinePrefix("> ")}
          title="Quote"
          className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
        >
          <Quote className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>

        {/* Code / Block */}
        <button
          type="button"
          onClick={() => applyFormat("`", "`", "code")}
          title="Code"
          className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
        >
          <Code className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>

        {/* Link */}
        <button
          type="button"
          onClick={() => applyFormat("[", "](https://example.com)", "link text")}
          title="Insert Link"
          className="p-1 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
        >
          <LinkIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>
      </div>

      {/* Optional bottom footer (cancel/save buttons & controls) */}
      {footer && (
        <div className="border-t bg-muted/10 px-3 py-1.5 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}
