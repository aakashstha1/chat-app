"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { API_URL } from "@/lib/api";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineIds, setOnlineIds] = useState(new Set());
  const [notifications, setNotifications] = useState([]); // incoming friend requests / accepts

  useEffect(() => {
    if (!user?._id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const s = io(API_URL, {
      withCredentials: true,
      auth: { userId: user._id },
    });
    socketRef.current = s;

    s.on("presence", ({ userId, online }) => {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    s.on("friendRequest", ({ from }) => {
      setNotifications((prev) => [
        { type: "request", user: from, id: `req-${from._id}-${Date.now()}` },
        ...prev,
      ]);
    });

    s.on("friendRequestAccepted", ({ by }) => {
      setNotifications((prev) => [
        { type: "accepted", user: by, id: `acc-${by._id}-${Date.now()}` },
        ...prev,
      ]);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider
      value={{
        socketRef,
        onlineIds,
        notifications,
        setNotifications,
        dismissNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
