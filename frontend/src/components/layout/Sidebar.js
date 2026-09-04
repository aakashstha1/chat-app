"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Bot, Users, User, LogOut } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import Avatar from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/chat", label: "Chats", icon: MessageCircle },
  { href: "/ai", label: "AI Assistant", icon: Bot },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { subscribe } = useSocket();
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = async () => {
    try {
      const { data } = await api.get("/users/friend-requests");
      setPendingCount(data.requests.length);
    } catch {
      // silent - badge just stays at its last known value
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional refetch whenever the route changes
    refreshPendingCount();
  }, [pathname]);

  // A new incoming request bumps the badge in real time without a refetch.
  useEffect(() => subscribe("friendRequest", () => setPendingCount((c) => c + 1)), [subscribe]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <aside className="flex w-[76px] shrink-0 flex-col items-center border-r border-border bg-surface py-4">
      <Link href="/profile" className="mb-6">
        <Avatar src={user?.avatar} name={user?.name} size="md" />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:bg-surface-hover hover:text-foreground",
              )}
            >
              <Icon size={20} />
              {href === "/friends" && pendingCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        title="Log out"
        className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition-colors hover:bg-danger/10 hover:text-danger"
      >
        <LogOut size={20} />
      </button>
    </aside>
  );
}
