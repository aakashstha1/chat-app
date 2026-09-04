import EmptyState from "@/components/ui/EmptyState";
import { MessageCircle } from "lucide-react";

export default function ChatIndexPage() {
  return (
    <EmptyState
      icon={MessageCircle}
      title="Select a conversation"
      description="Pick a friend from the list to see your messages, or start a new one from Friends."
    />
  );
}
