"use client";

import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { formatMessageTime } from "@/lib/utils";

export default function FriendRequestItem({ request, onRespond, busy }) {
  return (
    <div className="flex items-center gap-3 px-1 py-3">
      <Avatar src={request.sender.avatar} name={request.sender.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{request.sender.name}</p>
        <p className="truncate text-xs text-muted">
          @{request.sender.username} · {formatMessageTime(request.createdAt)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          loading={busy}
          onClick={() => onRespond(request._id, "accept")}
        >
          Accept
        </Button>
        <Button
          variant="ghost"
          className="px-3 py-1.5 text-xs"
          disabled={busy}
          onClick={() => onRespond(request._id, "reject")}
        >
          Decline
        </Button>
      </div>
    </div>
  );
}
