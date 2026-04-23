"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function AddToHomeScreenPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(iosDevice);

    const sessions = Number(window.localStorage.getItem("gta-mobile-sessions") ?? "0") + 1;
    window.localStorage.setItem("gta-mobile-sessions", String(sessions));
    if (sessions >= 3) {
      setShowPrompt(true);
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border border-border bg-card p-4 shadow-lg md:left-auto md:right-6 md:w-[360px]">
      <p className="text-sm font-medium">Install Ghost Trading Academy</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {isIos
          ? "Tap the Share icon, then 'Add to Home Screen'."
          : "Install the app for faster access and push notifications."}
      </p>
      {!isIos && deferredPrompt ? (
        <Button
          size="sm"
          className="mt-3"
          onClick={async () => {
            await deferredPrompt.prompt();
            setShowPrompt(false);
          }}
        >
          Add to Home Screen
        </Button>
      ) : null}
      <Button size="sm" variant="ghost" className="mt-2" onClick={() => setShowPrompt(false)}>
        Dismiss
      </Button>
    </div>
  );
}
