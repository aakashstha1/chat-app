"use client";

import { FileText, Download } from "lucide-react";
import { resolveUploadUrl } from "@/lib/api";
import { formatFileSize } from "@/lib/utils";

export default function AttachmentItem({ attachment }) {
  const url = resolveUploadUrl(attachment.url);

  if (attachment.kind === "image") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user uploads, not worth next/image domain config */}
        <img src={url} alt={attachment.name} className="max-h-64 w-auto max-w-full object-cover" />
      </a>
    );
  }

  if (attachment.kind === "video") {
    return (
      <video src={url} controls className="max-h-64 max-w-full rounded-lg">
        Your browser does not support video playback.
      </video>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.name}
      className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm hover:bg-surface-hover"
    >
      <FileText size={18} className="shrink-0 text-muted" />
      <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
      <span className="shrink-0 text-xs text-muted">{formatFileSize(attachment.size)}</span>
      <Download size={14} className="shrink-0 text-muted" />
    </a>
  );
}
