"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import api from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import Avatar from "./Avatar";

export default function NotificationBell() {
  const { notifications, setNotifications } = useSocket();
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users/friend-requests");
      setRequests(data.requests);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // whenever a live "friendRequest" notification arrives, refresh the list
  useEffect(() => {
    if (notifications.some((n) => n.type === "request")) {
      loadRequests();
    }
  }, [notifications]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const respond = async (id, action) => {
    setRequests((prev) => prev.filter((r) => r._id !== id));
    try {
      await api.post(`/users/friend-request/${id}/respond`, { action });
    } catch {
      loadRequests();
    }
  };

  const badgeCount = requests.length + notifications.filter((n) => n.type === "accepted").length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
      >
        <Bell size={20} />
        {badgeCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Friend requests
          </p>
          {loading && <p className="px-2 py-3 text-sm text-slate-400">Loading...</p>}
          {!loading && requests.length === 0 && (
            <p className="px-2 py-3 text-sm text-slate-400">No pending requests</p>
          )}
          <div className="max-h-80 overflow-y-auto">
            {requests.map((r) => (
              <div key={r._id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
                <Avatar user={r.sender} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{r.sender.name}</p>
                  <p className="truncate text-xs text-slate-400">@{r.sender.username}</p>
                </div>
                <button
                  onClick={() => respond(r._id, "accept")}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                  title="Accept"
                >
                  <Check size={15} />
                </button>
                <button
                  onClick={() => respond(r._id, "reject")}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200"
                  title="Reject"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>

          {notifications.filter((n) => n.type === "accepted").length > 0 && (
            <>
              <p className="mt-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Updates
              </p>
              {notifications
                .filter((n) => n.type === "accepted")
                .map((n) => (
                  <div key={n.id} className="flex items-center gap-3 rounded-lg p-2">
                    <Avatar user={n.user} size={32} />
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">{n.user.name}</span> accepted your friend request
                    </p>
                  </div>
                ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
