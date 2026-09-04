import { NextResponse } from "next/server";

const AUTH_ONLY_PATHS = ["/login", "/register", "/verify-email", "/forgot-password"];

// This is a cheap, optimistic check - it only looks at whether the
// "chat_token" cookie exists, not whether it's still valid (that
// requires calling the backend, which AuthContext does on mount).
// Its only job is to avoid a flash of the wrong screen before that
// client-side check resolves.
export function proxy(request) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has("chat_token");

  const isAuthOnlyPath =
    AUTH_ONLY_PATHS.some((p) => pathname === p) || pathname.startsWith("/reset-password");

  if (hasToken && isAuthOnlyPath) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  if (!hasToken && !isAuthOnlyPath && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)",
  ],
};
