"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Users, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "./NotificationBell";
import Avatar from "./Avatar";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const linkClass = (path) =>
    `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      pathname.startsWith(path)
        ? "bg-brand-50 text-brand-700"
        : "text-slate-600 hover:bg-slate-100"
    }`;

  const onLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-6">
        <Link href="/chat" className="flex items-center gap-2 font-semibold text-brand-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
            <MessageCircle size={18} />
          </div>
          SimpleChat
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/chat" className={linkClass("/chat")}>
            <MessageCircle size={16} />
            Chat
          </Link>
          <Link href="/friends" className={linkClass("/friends")}>
            <Users size={16} />
            Get Friends
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100"
          >
            <Avatar user={user} size={32} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="px-2 py-2">
                <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
                <p className="truncate text-xs text-slate-400">@{user?.username}</p>
              </div>
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut size={15} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
