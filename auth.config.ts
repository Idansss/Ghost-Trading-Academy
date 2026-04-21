import type { NextAuthConfig } from "next-auth";

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

      if (isAuthRoute) {
        return !isAuthed;
      }

      if (pathname.startsWith("/api/auth")) {
        return true;
      }

      if (
        pathname === "/" ||
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/journal") ||
        pathname.startsWith("/signals") ||
        pathname.startsWith("/outlook") ||
        pathname.startsWith("/analytics") ||
        pathname.startsWith("/education") ||
        pathname.startsWith("/calculator") ||
        pathname.startsWith("/community") ||
        pathname.startsWith("/notifications") ||
        pathname.startsWith("/profile")
      ) {
        return isAuthed;
      }

      if (isAdminRoute) {
        return isAuthed;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
