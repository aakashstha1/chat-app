"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import ThreadHeader from "@/components/chat/ThreadHeader";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageInput from "@/components/chat/MessageInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import Spinner from "@/components/ui/Spinner";

export default function AIAssistantPage() {
  const { notify } = useToast();
  const [assistant, setAssistant] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  // The backend has no "fetch AI conversation history" endpoint (only
  // discover-the-assistant and send-a-message), so the thread starts
  // empty each time this page loads - only GET /api/ai is available here.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/ai");
        setAssistant(data.assistant);
      } catch (err) {
        notify(err.message, "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, thinking]);

  const handleSend = async (text) => {
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      sender: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    setThinking(true);
    try {
      const { data } = await api.post("/ai/chat", { text });
      setMessages((prev) => [
        ...prev.filter((message) => message._id !== tempMessage._id),
        data.userMessage,
        data.aiMessage,
      ]);
    } catch (err) {
      setMessages((prev) =>
        prev.filter((message) => message._id !== tempMessage._id),
      );
      notify(err.message, "error");
    } finally {
      setThinking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <ThreadHeader
        avatar={assistant?.avatar}
        name={assistant?.name || "AI Assistant"}
        isAI
        statusLine="Always available"
      />

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && !thinking && (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-muted">
            <p className="font-medium text-foreground">
              Ask the assistant anything
            </p>
            <p className="max-w-xs text-sm">
              Answers are formatted in Markdown - code, lists, and tables render
              properly.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isOwn={message.sender !== assistant?._id}
            renderAsMarkdown={message.sender === assistant?._id}
          />
        ))}

        {thinking && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        onSend={handleSend}
        allowAttachments={false}
        placeholder="Message the AI assistant..."
      />
    </div>
  );
}
