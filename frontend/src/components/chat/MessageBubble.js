"use client";

import { formatMessageTime, formatFullTime, cn } from "@/lib/utils";
import AttachmentItem from "@/components/chat/AttachmentItem";
import MarkdownMessage from "@/components/ai/MarkdownMessage";

export default function MessageBubble({ message, isOwn, renderAsMarkdown = false }) {
  const hasText = Boolean(message.text?.trim());
  const hasAttachments = message.attachments?.length > 0;

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex max-w-[70%] flex-col gap-1.5 rounded-2xl px-3.5 py-2.5",
          isOwn
            ? "rounded-br-sm bg-accent text-accent-foreground"
            : "rounded-bl-sm border border-border bg-surface-raised text-foreground",
        )}
      >
        {hasAttachments && (
          <div className="flex flex-col gap-2">
            {message.attachments.map((att, i) => (
              <AttachmentItem key={i} attachment={att} />
            ))}
          </div>
        )}

        {hasText &&
          (renderAsMarkdown ? (
            <MarkdownMessage text={message.text} />
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.text}
            </p>
          ))}

        <span
          title={formatFullTime(message.createdAt)}
          className={cn(
            "self-end text-[10px]",
            isOwn ? "text-accent-foreground/70" : "text-muted",
          )}
        >
          {formatMessageTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
