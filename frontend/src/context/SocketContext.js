"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import getSocket from "@/lib/socket";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());
  const [typingFrom, setTypingFrom] = useState(() => new Set());

  // Any component can subscribe to raw socket events (mainly "newMessage")
  // without each one calling socket.on/off itself and risking duplicate
  // listeners across remounts. Components call `subscribe(event, handler)`
  // and get back an unsubscribe function.
  const listenersRef = useRef(new Map()); // event -> Set<handler>

  const subscribe = (event, handler) => {
    if (!listenersRef.current.has(event)) listenersRef.current.set(event, new Set());
    listenersRef.current.get(event).add(handler);
    return () => listenersRef.current.get(event)?.delete(handler);
  };

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;
    socket.connect();

    const dispatch = (event) => (payload) => {
      listenersRef.current.get(event)?.forEach((handler) => handler(payload));
    };

    socket.on("newMessage", dispatch("newMessage"));
    socket.on("friendRequest", dispatch("friendRequest"));
    socket.on("friendRequestAccepted", dispatch("friendRequestAccepted"));

    socket.on("presence", ({ userId, online }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    socket.on("typing", ({ from }) => {
      setTypingFrom((prev) => new Set(prev).add(from));
    });
    socket.on("stopTyping", ({ from }) => {
      setTypingFrom((prev) => {
        const next = new Set(prev);
        next.delete(from);
        return next;
      });
    });

    return () => {
      socket.off("newMessage");
      socket.off("friendRequest");
      socket.off("friendRequestAccepted");
      socket.off("presence");
      socket.off("typing");
      socket.off("stopTyping");
      socket.disconnect();
    };
  }, [user]);

  const emitTyping = (toUserId) => socketRef.current?.emit("typing", { to: toUserId });
  const emitStopTyping = (toUserId) =>
    socketRef.current?.emit("stopTyping", { to: toUserId });

  const isOnline = (userId) => onlineUserIds.has(userId);
  const isTyping = (userId) => typingFrom.has(userId);

  const value = { subscribe, emitTyping, emitStopTyping, isOnline, isTyping };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
};
