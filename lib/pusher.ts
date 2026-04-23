import Pusher from "pusher";
import { env } from "@/lib/env";

// AUDIT FIX: The Pusher server instance now lives at module scope and reads
// typed env values from lib/env instead of raw process.env access.
export const pusherServer =
  env.pusherAppId && env.pusherKey && env.pusherSecret && env.pusherCluster
    ? new Pusher({
        appId: env.pusherAppId!,
        key: env.pusherKey!,
        secret: env.pusherSecret!,
        cluster: env.pusherCluster!,
        useTLS: true,
      })
    : null;
