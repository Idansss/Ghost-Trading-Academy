"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Do NOT import @/lib/env here — this module is used from client hooks.
let browserClient: SupabaseClient | null = null;

/** Browser Supabase client for Realtime (anon key). */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      realtime: {
        params: { eventsPerSecond: 20 },
      },
    });
  }

  return browserClient;
}
