import PusherClient from "pusher-js";

// Do NOT import @/lib/env here — this module is imported by useChatRealtime
// (a "use client" hook). Importing lib/env bundles server-only env validation
// into the browser, which throws a ZodError because DATABASE_URL etc. are
// undefined in the browser. Read NEXT_PUBLIC_* vars directly instead.
let pusherInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") {
    return null;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new PusherClient(key, { cluster });
  }

  return pusherInstance;
}
