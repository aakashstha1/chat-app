"use client";

import { FileText, Download } from "lucide-react";
import { resolveMediaUrl } from "@/lib/api";

const formatTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function Attachment({ a }) {
  const url = resolveMediaUrl(a.url);
  if (a.kind === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={a.name} className="max-h-72 max-w-xs object-cover" />
      </a>
    );
  }
  if (a.kind === "video") {
    return (
      <video src={url} controls className="max-h-72 max-w-xs rounded-lg bg-black" />
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
    >
      <FileText size={18} className="shrink-0 text-brand-600" />
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-700">{a.name}</p>
        <p className="text-xs text-slate-400">{formatSize(a.size)}</p>
      </div>
      <Download size={15} className="ml-auto shrink-0 text-slate-400" />
    </a>
  );
}

export default function MessageBubble({ message, mine }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[70%] flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
        {message.attachments?.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {message.attachments.map((a, i) => (
              <Attachment key={i} a={a} />
            ))}
          </div>
        )}
        {message.text && (
          <div
            className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
              mine
                ? "rounded-br-sm bg-brand-600 text-white"
                : "rounded-bl-sm bg-white text-slate-800 shadow-sm"
            }`}
          >
            {message.text}
          </div>
        )}
        <span className="px-1 text-[11px] text-slate-400">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}
