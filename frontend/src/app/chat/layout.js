import RequireAuth from "@/components/RequireAuth";
import Navbar from "@/components/Navbar";
import FriendsSidebar from "@/components/FriendsSidebar";

export default function ChatLayout({ children }) {
  return (
    <RequireAuth>
      <div className="flex h-screen flex-col">
        <Navbar />
        <div className="flex min-h-0 flex-1">
          <FriendsSidebar />
          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
