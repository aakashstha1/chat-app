"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const Input = forwardRef(function Input(
  { label, error, type = "text", className, ...props },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="font-medium text-foreground/90">{label}</span>}
      <span className="relative">
        <input
          ref={ref}
          type={resolvedType}
          className={cn(
            "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-foreground placeholder:text-muted",
            "outline-none transition-colors focus:border-accent/70 focus:ring-2 focus:ring-accent/20",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error && "border-danger/60 focus:border-danger focus:ring-danger/20",
            isPassword && "pr-10",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </span>
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
});

export default Input;
