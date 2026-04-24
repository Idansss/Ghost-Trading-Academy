import { broadcastRealtimeEvent } from "@/lib/supabase/broadcast";

export { broadcastRealtimeEvent };

/** Drop-in replacement for the old Pusher server `.trigger` used by SignalService. */
export const realtimePublisher = {
  trigger(channel: string, event: string, data: unknown) {
    return broadcastRealtimeEvent(channel, event, data);
  },
};
