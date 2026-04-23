"use client";

import { useEffect, useRef } from "react";

export function SignalViewedTracker({ signalId }: { signalId: string }) {
  const didTrackRef = useRef(false);

  useEffect(() => {
    if (didTrackRef.current) {
      return;
    }

    didTrackRef.current = true;

    void fetch(`/api/signals/${signalId}/view`, {
      method: "POST",
    });
  }, [signalId]);

  return null;
}
