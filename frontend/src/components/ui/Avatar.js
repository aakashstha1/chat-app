"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import { resolveUploadUrl } from "@/lib/api";
import { getInitials, cn } from "@/lib/utils";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export default function Avatar({
  src,
  name,
  size = "md",
  online,
  isAI = false,
  className,
}) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = src ? resolveUploadUrl(src) : null;
  const showImage = resolvedSrc && !failed;

  return (
    <span className={cn("relative inline-flex shrink-0", SIZES[size], className)}>
      <span
        className={cn(
          "flex h-full w-full items-center justify-center overflow-hidden rounded-full font-semibold",
          isAI
            ? "bg-gradient-to-br from-accent to-amber-600 text-accent-foreground"
            : "bg-surface-raised text-foreground/80 border border-border",
        )}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote/user-uploaded, not worth next/image config here
          <img
            src={resolvedSrc}
            alt={name || "avatar"}
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : isAI ? (
          <Bot size="60%" />
        ) : (
          getInitials(name)
        )}
      </span>
      {typeof online === "boolean" && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
            online ? "bg-success" : "bg-muted/50",
          )}
        />
      )}
    </span>
  );
}
