// CLAUDE FIX: Reusable dismissible banner explaining TradingView sign-in benefits
"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Info, X } from "lucide-react";

const STORAGE_KEY = "tv-signin-banner-dismissed";

export function TradingViewSignInBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  return (
    <div className="relative flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm mb-6">
      <Info className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
      <div className="flex-1 space-y-1.5">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Tip:</span> To save your chart drawings, indicators, and layouts across sessions, sign in to TradingView. Once signed in there, your changes here will save automatically.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="https://www.tradingview.com/#signin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Sign in to TradingView
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <span className="text-xs text-muted-foreground">A free account is enough — no upgrade needed.</span>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
