import PusherClient from "pusher-js";
import { env } from "@/lib/env";

let pusherInstance: PusherClient | null = null;

// AUDIT FIX: The client singleton now guards against SSR usage and only creates
// a single browser-side connection when public Pusher env vars are configured.
export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!env.publicPusherKey || !env.publicPusherCluster) {
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new PusherClient(env.publicPusherKey!, {
      cluster: env.publicPusherCluster!,
    });
  }

  return pusherInstance;
}
