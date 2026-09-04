"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MessageCircleOff } from "lucide-react";
import api from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

export default function ConversationList() {
  const { friendId: activeFriendId } = useParams();
  const { isOnline, subscribe } = useSocket();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/users/friends");
        if (!cancelled) setFriends(data.friends);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh the list once when a request gets accepted so a brand new
  // friend shows up without a manual reload.
  useEffect(
    () =>
      subscribe("friendRequestAccepted", ({ by }) => {
        setFriends((prev) => (prev.some((f) => f._id === by._id) ? prev : [by, ...prev]));
      }),
    [subscribe],
  );

  return (
    <div className="flex h-full w-[300px] shrink-0 flex-col border-r border-border">
      <div className="border-b border-border px-4 py-4">
        <h1 className="text-base font-semibold">Chats</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : friends.length === 0 ? (
          <EmptyState
            icon={MessageCircleOff}
            title="No conversations yet"
            description="Add friends from the Friends tab to start chatting."
          />
        ) : (
          friends.map((friend) => (
            <Link
              key={friend._id}
              href={`/chat/${friend._id}`}
              className={cn(
                "flex items-center gap-3 border-l-2 px-4 py-3 transition-colors hover:bg-surface-hover",
                activeFriendId === friend._id
                  ? "border-l-accent bg-surface-hover"
                  : "border-l-transparent",
              )}
            >
              <Avatar src={friend.avatar} name={friend.name} online={isOnline(friend._id)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{friend.name}</p>
                <p className="truncate text-xs text-muted">
                  {isOnline(friend._id) ? "Online" : `@${friend.username}`}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
