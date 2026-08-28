"use client";

import { useRef, useState } from "react";
import { Paperclip, SendHorizontal, X, FileText, Loader2 } from "lucide-react";

export default function MessageComposer({ onSend, onTyping }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected].slice(0, 6));
    e.target.value = "";
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    onTyping?.();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;
    setSending(true);
    try {
      await onSend(text.trim(), files);
      setText("");
      setFiles([]);
    } finally {
      setSending(false);
    }
  };

  const preview = (file) => {
    if (file.type.startsWith("image/")) return URL.createObjectURL(file);
    return null;
  };

  return (
    <form onSubmit={submit} className="border-t border-slate-200 bg-white p-3">
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f, i) => {
            const img = preview(f);
            return (
              <div
                key={i}
                className="relative flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-1 pr-2"
              >
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={f.name} className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-200">
                    <FileText size={16} className="text-slate-500" />
                  </div>
                )}
                <span className="max-w-[100px] truncate text-xs text-slate-600">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-white hover:bg-slate-400"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.zip,.txt,.xls,.xlsx,.ppt,.pptx"
          className="hidden"
          onChange={handleFiles}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
          title="Attach files, images or videos"
        >
          <Paperclip size={19} />
        </button>

        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
          rows={1}
          placeholder="Type a message..."
          className="max-h-32 flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />

        <button
          type="submit"
          disabled={sending || (!text.trim() && files.length === 0)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
        >
          {sending ? <Loader2 size={17} className="animate-spin" /> : <SendHorizontal size={17} />}
        </button>
      </div>
    </form>
  );
}
