"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/Avatar";
import MessageBubble from "@/components/MessageBubble";
import MessageComposer from "@/components/MessageComposer";

export default function ConversationPage() {
  const { friendId } = useParams();
  const { user } = useAuth();
  const { socket, onlineIds } = useSocket();

  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const shouldStickToBottom = useRef(true);

  const loadFriend = useCallback(async () => {
    const { data } = await api.get(`/users/${friendId}`);
    setFriend(data.user);
  }, [friendId]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/messages/${friendId}`, {
        params: { page: 1, limit: 30 },
      });
      setMessages(data.messages);
      setHasMore(data.hasMore);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, [friendId]);

  useEffect(() => {
    loadFriend();
    loadMessages();
  }, [loadFriend, loadMessages]);

  useEffect(() => {
    shouldStickToBottom.current = true;
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [friendId]);

  useEffect(() => {
    if (shouldStickToBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const onNewMessage = (msg) => {
      const otherId = msg.sender === friendId || msg.sender?._id === friendId
        ? msg.sender
        : msg.receiver;
      const senderId = typeof msg.sender === "object" ? msg.sender._id : msg.sender;
      const receiverId = typeof msg.receiver === "object" ? msg.receiver._id : msg.receiver;
      const belongsHere =
        (senderId === friendId && receiverId === user._id) ||
        (senderId === user._id && receiverId === friendId);
      if (!belongsHere) return;
      setMessages((prev) => [...prev, msg]);
      setTyping(false);
    };
    const onTyping = ({ from }) => {
      if (from === friendId) setTyping(true);
    };
    const onStopTyping = ({ from }) => {
      if (from === friendId) setTyping(false);
    };

    socket.on("newMessage", onNewMessage);
    socket.on("typing", onTyping);
    socket.on("stopTyping", onStopTyping);
    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("typing", onTyping);
      socket.off("stopTyping", onStopTyping);
    };
  }, [socket, friendId, user?._id]);

  const handleScroll = async () => {
    const el = scrollRef.current;
    if (!el) return;
    shouldStickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;

    if (el.scrollTop < 60 && hasMore && !loadingMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      const prevHeight = el.scrollHeight;
      try {
        const { data } = await api.get(`/messages/${friendId}`, {
          params: { page: nextPage, limit: 30 },
        });
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMore(data.hasMore);
        setPage(nextPage);
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
          }
        });
      } finally {
        setLoadingMore(false);
      }
    }
  };

  let typingTimeout;
  const notifyTyping = () => {
    socket?.emit("typing", { to: friendId });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket?.emit("stopTyping", { to: friendId }), 1500);
  };

  const send = async (text, files) => {
    const form = new FormData();
    form.append("text", text);
    files.forEach((f) => form.append("files", f));
    const { data } = await api.post(`/messages/${friendId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setMessages((prev) => [...prev, data.message]);
    socket?.emit("stopTyping", { to: friendId });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        {friend && (
          <>
            <Avatar user={friend} size={38} online={onlineIds.has(friendId) || friend.online} />
            <div>
              <p className="text-sm font-semibold text-slate-800">{friend.name}</p>
              <p className="text-xs text-slate-400">
                {typing ? "typing..." : onlineIds.has(friendId) ? "Online" : `@${friend.username}`}
              </p>
            </div>
          </>
        )}
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4">
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 size={16} className="animate-spin text-slate-400" />
          </div>
        )}
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <MessageBubble key={m._id} message={m} mine={(m.sender?._id || m.sender) === user._id} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <MessageComposer onSend={send} onTyping={notifyTyping} />
    </div>
  );
}
