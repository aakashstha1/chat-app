"use client";

import { useState } from "react";
import { UserPlus, Clock, UserCheck } from "lucide-react";
import api from "@/lib/api";
import Avatar from "./Avatar";

export default function UserCard({ user, onChange }) {
  const [status, setStatus] = useState(user.status);
  const [loading, setLoading] = useState(false);

  const addFriend = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/users/friend-request/${user._id}`);
      setStatus(data.status);
      onChange?.(user._id, data.status);
    } catch (err) {
      alert(err?.response?.data?.message || "Could not send request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <Avatar user={user} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{user.name}</p>
        <p className="truncate text-xs text-slate-400">@{user.username}</p>
      </div>

      {status === "friends" && (
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600">
          <UserCheck size={14} /> Friends
        </span>
      )}
      {status === "pending_sent" && (
        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
          <Clock size={14} /> Pending
        </span>
      )}
      {status === "pending_received" && (
        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600">
          Check notifications
        </span>
      )}
      {status === "none" && (
        <button
          onClick={addFriend}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          <UserPlus size={14} />
          Add
        </button>
      )}
    </div>
  );
}
