"use client";

import { Check, Clock, UserPlus } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";

const STATUS_LABEL = {
  friends: { label: "Friends", icon: Check, variant: "secondary", disabled: true },
  pending_sent: { label: "Requested", icon: Clock, variant: "secondary", disabled: true },
};

export default function UserSearchResult({ user, onAddFriend, onRespond, busy }) {
  const status = STATUS_LABEL[user.status];

  return (
    <div className="flex items-center gap-3 px-1 py-3">
      <Avatar src={user.avatar} name={user.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted">@{user.username}</p>
      </div>

      {user.status === "pending_received" ? (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            loading={busy}
            onClick={() => onRespond(user.requestId, "accept")}
          >
            Accept
          </Button>
          <Button
            variant="ghost"
            className="px-3 py-1.5 text-xs"
            disabled={busy}
            onClick={() => onRespond(user.requestId, "reject")}
          >
            Decline
          </Button>
        </div>
      ) : status ? (
        <Button variant={status.variant} disabled className="px-3 py-1.5 text-xs">
          <status.icon size={14} />
          {status.label}
        </Button>
      ) : (
        <Button
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          loading={busy}
          onClick={() => onAddFriend(user._id)}
        >
          <UserPlus size={14} />
          Add
        </Button>
      )}
    </div>
  );
}
