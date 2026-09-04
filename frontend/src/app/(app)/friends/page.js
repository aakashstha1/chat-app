"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, Inbox, Users as UsersIcon, Search, MessageCircle } from "lucide-react";
import api from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { useToast } from "@/context/ToastContext";
import Input from "@/components/ui/Input";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import UserSearchResult from "@/components/friends/UserSearchResult";
import FriendRequestItem from "@/components/friends/FriendRequestItem";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "search", label: "Find people", icon: Search },
  { key: "requests", label: "Requests", icon: Inbox },
  { key: "friends", label: "Friends", icon: UsersIcon },
];

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState("search");
  const { notify } = useToast();

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold">Friends</h1>
        <div className="mt-4 flex gap-1 rounded-lg bg-surface p-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors",
                activeTab === key
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === "search" && <SearchTab notify={notify} />}
        {activeTab === "requests" && <RequestsTab notify={notify} />}
        {activeTab === "friends" && <FriendsTab />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function SearchTab({ notify }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const runSearch = async (searchQuery, pageNum = 1, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const { data } = await api.get("/users/search", {
        params: { query: searchQuery, page: pageNum, limit: 15 },
      });
      setResults((prev) => (append ? [...prev, ...data.users] : data.users));
      setPage(data.page);
      setHasMore(data.hasMore);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  };

  // Debounce keystrokes so we don't fire a request per character.
  useEffect(() => {
    const timer = setTimeout(() => runSearch(query, 1, false), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runSearch is stable in intent, only `query` should retrigger
  }, [query]);

  const updateUserStatus = (userId, patch) =>
    setResults((prev) => prev.map((u) => (u._id === userId ? { ...u, ...patch } : u)));

  const handleAddFriend = async (userId) => {
    setBusyId(userId);
    try {
      const { data } = await api.post(`/users/friend-request/${userId}`);
      updateUserStatus(userId, { status: data.status });
      notify(data.message, "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleRespond = async (requestId, action, userId) => {
    setBusyId(userId);
    try {
      const { data } = await api.post(`/users/friend-request/${requestId}/respond`, { action });
      updateUserStatus(userId, { status: data.status, requestId: null });
      notify(data.message, "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Search by name or username"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : results.length === 0 ? (
        <EmptyState icon={UserPlus} title="No one found" description="Try a different name or username." />
      ) : (
        <div className="divide-y divide-border">
          {results.map((user) => (
            <UserSearchResult
              key={user._id}
              user={user}
              busy={busyId === user._id}
              onAddFriend={handleAddFriend}
              onRespond={(requestId, action) => handleRespond(requestId, action, user._id)}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <Button
          variant="secondary"
          className="mx-auto"
          loading={loadingMore}
          onClick={() => runSearch(query, page + 1, true)}
        >
          Load more
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function RequestsTab({ notify }) {
  const { subscribe } = useSocket();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users/friend-requests");
      setRequests(data.requests);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time fetch on mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // New incoming request while this tab is open - add it live instead
  // of waiting for the next visit.
  useEffect(
    () =>
      subscribe("friendRequest", ({ from }) => {
        setRequests((prev) => [{ _id: from._id, sender: from, createdAt: new Date() }, ...prev]);
      }),
    [subscribe],
  );

  const handleRespond = async (requestId, action) => {
    setBusyId(requestId);
    try {
      const { data } = await api.post(`/users/friend-request/${requestId}/respond`, { action });
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
      notify(data.message, "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState icon={Inbox} title="No pending requests" description="You're all caught up." />
    );
  }

  return (
    <div className="divide-y divide-border">
      {requests.map((request) => (
        <FriendRequestItem
          key={request._id}
          request={request}
          busy={busyId === request._id}
          onRespond={handleRespond}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

function FriendsTab() {
  const { isOnline } = useSocket();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/users/friends");
        setFriends(data.friends);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="No friends yet"
        description="Search for people above to send your first friend request."
      />
    );
  }

  return (
    <div className="divide-y divide-border">
      {friends.map((friend) => (
        <div key={friend._id} className="flex items-center gap-3 px-1 py-3">
          <Avatar src={friend.avatar} name={friend.name} online={isOnline(friend._id)} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{friend.name}</p>
            <p className="truncate text-xs text-muted">@{friend.username}</p>
          </div>
          <Link
            href={`/chat/${friend._id}`}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground"
            aria-label={`Message ${friend.name}`}
          >
            <MessageCircle size={17} />
          </Link>
        </div>
      ))}
    </div>
  );
}
