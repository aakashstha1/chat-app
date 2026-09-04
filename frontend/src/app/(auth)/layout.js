import { MessageCircle } from "lucide-react";

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <MessageCircle size={22} />
          </span>
          <h1 className="text-lg font-semibold tracking-tight">Chat</h1>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-black/20">
          {children}
        </div>
      </div>
    </div>
  );
}
