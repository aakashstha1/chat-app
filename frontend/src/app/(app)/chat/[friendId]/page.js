"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useToast } from "@/context/ToastContext";
import ThreadHeader from "@/components/chat/ThreadHeader";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageInput from "@/components/chat/MessageInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";

const PAGE_LIMIT = 30;

export default function ChatThreadPage({ params }) {
  const { friendId } = use(params); 
  const { user } = useAuth();
  const { subscribe, emitTyping, emitStopTyping, isOnline, isTyping } = useSocket();
  const { notify } = useToast();

  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  // Load the friend's public profile + first page of history whenever
  // the conversation being viewed changes.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the loading spinner when switching conversations
    setLoading(true);
    (async () => {
      try {
        const [profileRes, messagesRes] = await Promise.all([
          api.get(`/users/${friendId}`),
          api.get(`/messages/${friendId}`, { params: { page: 1, limit: PAGE_LIMIT } }),
        ]);
        if (cancelled) return;
        setFriend(profileRes.data.user);
        setMessages([...messagesRes.data.messages].reverse()); // backend returns newest-first
        setPage(1);
        setHasMore(messagesRes.data.messages.length === PAGE_LIMIT);
      } catch (err) {
        notify(err.message, "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- notify identity is stable enough here
  }, [friendId]);

  // New messages arrive over the socket for both directions of this
  // conversation; anything involving someone else is ignored.
  useEffect(
    () =>
      subscribe("newMessage", (message) => {
        const involvesThisThread =
          [message.sender, message.receiver].includes(friendId) &&
          [message.sender, message.receiver].includes(user._id);
        if (!involvesThisThread) return;
        setMessages((prev) => [...prev, message]);
      }),
    [subscribe, friendId, user._id],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const loadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const container = scrollRef.current;
      const prevHeight = container?.scrollHeight || 0;

      const { data } = await api.get(`/messages/${friendId}`, {
        params: { page: nextPage, limit: PAGE_LIMIT },
      });
      setMessages((prev) => [...[...data.messages].reverse(), ...prev]);
      setPage(nextPage);
      setHasMore(data.messages.length === PAGE_LIMIT);

      // Keep the viewport anchored on the same message instead of
      // jumping to the top after older messages are prepended.
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - prevHeight;
      });
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSend = async (text, files) => {
    const formData = new FormData();
    formData.append("text", text);
    files.forEach((f) => formData.append("files", f));

    try {
      await api.post(`/messages/${friendId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // No optimistic append needed - the backend echoes the saved
      // message back to us over our own socket room ("newMessage").
    } catch (err) {
      notify(err.message, "error");
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
        avatar={friend?.avatar}
        name={friend?.name}
        statusLine={isOnline(friendId) ? "Online" : `@${friend?.username}`}
      />

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {hasMore && (
          <div className="flex justify-center pb-2">
            <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
              Load older messages
            </Button>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isOwn={message.sender === user._id}
          />
        ))}

        {isTyping(friendId) && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        onSend={handleSend}
        onTyping={() => emitTyping(friendId)}
        onStopTyping={() => emitStopTyping(friendId)}
      />
    </div>
  );
}
