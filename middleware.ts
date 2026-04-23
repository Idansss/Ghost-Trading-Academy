import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";
import { checkRateLimit } from "@/lib/rate-limit";

const { auth } = NextAuth(authConfig);

export default auth(async (request) => {
  if (request.nextUrl.pathname.startsWith("/api/") && !request.nextUrl.pathname.startsWith("/api/auth")) {
    const userId = request.auth?.user?.id;
    const ip = request.headers.get("x-forwarded-for") ?? "unknown-ip";
    const rate = await checkRateLimit("api", userId ?? ip);
    if (!rate.success) {
      // AUDIT FIX: Response shape changed from non-standard { error: string } to
      // the required envelope { success: false, error: { code, message } } so all
      // rate-limit rejections are consistent with AppError-originated responses.
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please slow down.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))),
          },
        },
      );
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/journal/:path*",
    "/signals/:path*",
    "/outlook/:path*",
    "/analytics/:path*",
    "/education/:path*",
    "/calculator/:path*",
    "/community/:path*",
    "/watchlist/:path*",
    "/profile/:path*",
    "/auth/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};
