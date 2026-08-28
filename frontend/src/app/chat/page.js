import { MessageCircle } from "lucide-react";

export default function ChatIndexPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <MessageCircle size={30} />
      </div>
      <p className="text-sm">Select a friend on the left to start chatting</p>
    </div>
  );
}
