import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTypingChannelName, requireChannelAccess } from "@/lib/chat";
import { broadcastRealtimeEvent } from "@/lib/realtime";
import { typingSchema } from "@/lib/validations/chat";
import type { ApiResponse } from "@/types/chat";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

const TYPING_RATE_WINDOW_MS = 10_000;
const TYPING_RATE_LIMIT = 10;
const typingRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isTypingRateLimited(userId: string, channelId: string): boolean {
  const key = `${userId}:${channelId}`;
  const now = Date.now();
  const current = typingRateLimitMap.get(key);

  if (!current || current.resetAt <= now) {
    typingRateLimitMap.set(key, { count: 1, resetAt: now + TYPING_RATE_WINDOW_MS });
    return false;
  }

  if (current.count >= TYPING_RATE_LIMIT) {
    return true;
  }

  typingRateLimitMap.set(key, { ...current, count: current.count + 1 });
  return false;
}

// AUDIT FIX: Typing events use Supabase broadcast; enforce membership access,
// rate-limit keystroke spam, and include user name/avatar in the event payload.
export async function POST(request: Request): Promise<NextResponse<ApiResponse<{ ok: true }> | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = typingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const access = await requireChannelAccess(session.user.id, parsed.data.channelId);
    if (!access) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (isTypingRateLimited(session.user.id, parsed.data.channelId)) {
      return NextResponse.json({ error: "Typing rate limit exceeded." }, { status: 429 });
    }

    try {
      await broadcastRealtimeEvent(
        getTypingChannelName(parsed.data.channelId),
        parsed.data.isTyping ? "typing-start" : "typing-stop",
        {
          userId: session.user.id,
          userName: session.user.name,
          userAvatar: session.user.avatarUrl ?? null,
        },
      );
    } catch (realtimeError) {
      console.error("[chat/typing POST] Realtime broadcast failed", realtimeError);
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("[chat/typing POST]", error);
    return NextResponse.json({ error: "Unable to emit typing event." }, { status: 500 });
  }
}
