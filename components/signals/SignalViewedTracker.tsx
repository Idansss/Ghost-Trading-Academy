"use client";

import { useEffect, useRef } from "react";

export function SignalViewedTracker({ signalId }: { signalId: string }) {
  const didTrackRef = useRef(false);

  useEffect(() => {
    if (didTrackRef.current) {
      return;
    }

    didTrackRef.current = true;

    // CLAUDE FIX: 1.5s delay ensures the user actually read the page before we
    // mark it viewed — prevents completion triggering on instant back-navigation.
    const timer = setTimeout(() => {
      void fetch(`/api/signals/${signalId}/view`, { method: "POST" });
    }, 1500);

    return () => clearTimeout(timer);
  }, [signalId]);

  return null;
}
