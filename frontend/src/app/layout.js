import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { ToastProvider } from "@/context/ToastContext";

// Not using next/font/google here on purpose: it requires a build-time
// fetch to fonts.googleapis.com, which fails in network-restricted
// environments. System font stacks (defined as --font-geist-* fallbacks
// in globals.css) look close enough to Geist and need no network access.

export const metadata = {
  title: "Chat",
  description: "Real-time messaging with friends and a built-in AI assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Provider order matters: SocketProvider reads the user from
            AuthProvider, and ToastProvider is used by both. */}
        <AuthProvider>
          <ToastProvider>
            <SocketProvider>{children}</SocketProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
