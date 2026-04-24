import { getSupabaseServiceClient } from "@/lib/supabase/admin";

const SUBSCRIBE_TIMEOUT_MS = 12_000;

/**
 * Publish one Supabase Realtime **broadcast** event (server → subscribers).
 * Uses a short-lived channel subscription + send, then removes the channel.
 * Never throws — logs and resolves so HTTP handlers are not failed by Realtime.
 *
 * Requires Supabase project Realtime enabled; in the dashboard, allow Broadcast
 * for your channel patterns (public broadcast is typical for anon subscribers).
 */
export async function broadcastRealtimeEvent(
  channelName: string,
  event: string,
  payload: unknown,
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return;
  }

  let serializable: Record<string, unknown>;
  try {
    serializable = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  } catch (error) {
    console.error("[supabase broadcast] payload is not JSON-serializable", channelName, event, error);
    return;
  }

  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { ack: false },
    },
  });

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      console.error("[supabase broadcast] subscribe timeout", channelName, event);
      void supabase.removeChannel(channel);
      resolve();
    }, SUBSCRIBE_TIMEOUT_MS);

    channel.subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        void channel
          .send({
            type: "broadcast",
            event,
            payload: serializable,
          })
          .then((sendStatus) => {
            clearTimeout(timeout);
            void supabase.removeChannel(channel);
            if (sendStatus !== "ok") {
              console.error("[supabase broadcast] send status", channelName, event, sendStatus);
            }
            resolve();
          });
        return;
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        clearTimeout(timeout);
        void supabase.removeChannel(channel);
        console.error("[supabase broadcast] subscribe failed", channelName, event, status, err);
        resolve();
      }
    });
  });
}
