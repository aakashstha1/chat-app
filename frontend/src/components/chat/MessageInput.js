"use client";

import { useRef, useState } from "react";
import { Paperclip, Send, X, FileText } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

const MAX_FILES = 6;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // matches the backend's multer limit

export default function MessageInput({
  onSend,
  onTyping,
  onStopTyping,
  allowAttachments = true,
  placeholder = "Type a message...",
  disabled = false,
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fires "typing" at most once per burst of keystrokes, then
  // auto-emits "stopTyping" after a short pause - avoids spamming the
  // socket on every keypress.
  const handleChange = (e) => {
    setText(e.target.value);
    if (!onTyping) return;
    onTyping();
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onStopTyping?.(), 1500);
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    const combined = [...files, ...selected].slice(0, MAX_FILES);
    setFiles(combined.filter((f) => f.size <= MAX_FILE_SIZE));
    e.target.value = ""; // allow re-selecting the same file later
  };

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending || disabled) return;
    if (!text.trim() && files.length === 0) return;

    setSending(true);
    clearTimeout(typingTimeoutRef.current);
    onStopTyping?.();
    try {
      await onSend(text.trim(), files);
      setText("");
      setFiles([]);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-surface px-4 py-3">
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((file, i) => (
            <span
              key={`${file.name}-${i}`}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs"
            >
              <FileText size={12} className="text-muted" />
              <span className="max-w-[140px] truncate">{file.name}</span>
              <span className="text-muted">{formatFileSize(file.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-muted hover:text-danger"
                aria-label={`Remove ${file.name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {allowAttachments && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFileSelect}
              disabled={disabled || files.length >= MAX_FILES}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || files.length >= MAX_FILES}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-40"
              aria-label="Attach files"
            >
              <Paperclip size={19} />
            </button>
          </>
        )}

        <textarea
          rows={1}
          value={text}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          className="max-h-32 flex-1 resize-none rounded-2xl border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent/60"
        />

        <button
          type="submit"
          disabled={disabled || sending || (!text.trim() && files.length === 0)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-opacity disabled:opacity-40"
          aria-label="Send message"
        >
          <Send size={17} />
        </button>
      </div>
    </form>
  );
}
