"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import Navbar from "@/components/Navbar";
import UserCard from "@/components/UserCard";
import api from "@/lib/api";

export default function FriendsPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const debounceRef = useRef(null);
  const sentinelRef = useRef(null);

  const fetchUsers = useCallback(async (q, pageNum) => {
    const { data } = await api.get("/users/search", {
      params: { query: q, page: pageNum, limit: 15 },
    });
    return data;
  }, []);

  const runSearch = useCallback(
    async (q) => {
      setLoading(true);
      try {
        const data = await fetchUsers(q, 1);
        setUsers(data.users);
        setPage(1);
        setHasMore(data.hasMore);
      } finally {
        setLoading(false);
      }
    },
    [fetchUsers]
  );

  useEffect(() => {
    let cancelled = false;

    fetchUsers("", 1)
      .then((data) => {
        if (cancelled) return;
        setUsers(data.users);
        setPage(1);
        setHasMore(data.hasMore);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchUsers]);

  const onQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 350);
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await fetchUsers(query, nextPage);
      setUsers((prev) => [...prev, ...data.users]);
      setPage(nextPage);
      setHasMore(data.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchUsers, hasMore, loading, loadingMore, page, query]);

  // IntersectionObserver-based lazy loading
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const onStatusChange = (id, status) => {
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, status } : u)));
  };

  return (
    <RequireAuth>
      <div className="flex h-screen flex-col">
        <Navbar />
        <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-6">
          <h1 className="mb-4 text-xl font-semibold text-slate-800">Find friends</h1>

          <div className="relative mb-5">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={onQueryChange}
              placeholder="Search by username or name..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {users.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-400">No users found</p>
              )}
              {users.map((u) => (
                <UserCard key={u._id} user={u} onChange={onStatusChange} />
              ))}
              <div ref={sentinelRef} />
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <Loader2 size={18} className="animate-spin text-slate-400" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
