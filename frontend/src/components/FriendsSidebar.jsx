"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Users } from "lucide-react";
import api from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import Avatar from "./Avatar";

export default function FriendsSidebar() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const { onlineIds, socket } = useSocket();
  const params = useParams();
  const activeId = params?.friendId;

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users/friends");
      setFriends(data.friends);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // refresh the list when a request gets accepted (either side)
  useEffect(() => {
    if (!socket) return;
    const onAccepted = () => load();
    socket.on("friendRequestAccepted", onAccepted);
    return () => socket.off("friendRequestAccepted", onAccepted);
  }, [socket]);

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-700">Friends</h2>
        <Link
          href="/friends"
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          Add friend
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">Loading friends...</p>
        )}
        {!loading && friends.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Users className="text-slate-300" size={32} />
            <p className="text-sm text-slate-400">
              No friends yet. Head to{" "}
              <Link href="/friends" className="font-medium text-brand-600 hover:underline">
                Get Friends
              </Link>{" "}
              to add some.
            </p>
          </div>
        )}
        {friends.map((f) => (
          <Link
            key={f._id}
            href={`/chat/${f._id}`}
            className={`flex items-center gap-3 px-4 py-2.5 transition hover:bg-slate-50 ${
              activeId === f._id ? "bg-brand-50" : ""
            }`}
          >
            <Avatar user={f} size={40} online={onlineIds.has(f._id) || f.online} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{f.name}</p>
              <p className="truncate text-xs text-slate-400">@{f.username}</p>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
