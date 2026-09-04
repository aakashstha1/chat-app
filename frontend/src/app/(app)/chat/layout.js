import ConversationList from "@/components/chat/ConversationList";

export default function ChatLayout({ children }) {
  return (
    <div className="flex h-full w-full">
      <ConversationList />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
