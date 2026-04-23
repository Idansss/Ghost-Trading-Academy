import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

const authConfig = {
  providers: [],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      const isAuthed = Boolean(auth?.user);
      const isAuthRoute = pathname.startsWith("/auth");
      const isAdminRoute = pathname.startsWith("/admin");
      // AUDIT FIX: Treat /api/auth/* as always allowed — NextAuth's own endpoints
      // must never be blocked by this guard.
      if (pathname.startsWith("/api/auth")) {
        return true;
      }

      // AUDIT FIX: Previously returned `false` for authenticated users on auth routes,
      // which caused NextAuth to redirect to /auth/login again — an infinite loop.
      // Now explicitly redirect to /dashboard to break the cycle.
      if (isAuthRoute) {
        if (isAuthed) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return true;
      }

      // Root "/" is a public landing page — unauthenticated users see it,
      // authenticated users are redirected in page.tsx.
      if (pathname === "/") {
        return true;
      }

      const isProtectedRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/journal") ||
        pathname.startsWith("/signals") ||
        pathname.startsWith("/outlook") ||
        pathname.startsWith("/analytics") ||
        pathname.startsWith("/education") ||
        pathname.startsWith("/calculator") ||
        pathname.startsWith("/community") ||
        pathname.startsWith("/watchlist") ||
        pathname.startsWith("/notifications") ||
        pathname.startsWith("/profile");

      if (isProtectedRoute) {
        return isAuthed;
      }

      // AUDIT FIX: Admin routes now enforce the ADMIN role at the middleware level,
      // not just at the individual API handler level. Non-admin authenticated users
      // are redirected to /dashboard instead of seeing admin UI that will fail all
      // its data fetches with 403s.
      if (isAdminRoute) {
        if (!isAuthed) return false;
        const userRole = (auth?.user as { role?: string } | undefined)?.role;
        if (userRole !== "ADMIN") {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return true;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
