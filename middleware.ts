import NextAuth from "next-auth";
import authConfig from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/journal/:path*",
    "/signals/:path*",
    "/outlook/:path*",
    "/analytics/:path*",
    "/education/:path*",
    "/calculator/:path*",
    "/community/:path*",
    "/profile/:path*",
    "/auth/:path*",
    "/admin/:path*",
  ],
};
