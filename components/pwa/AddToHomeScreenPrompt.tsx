"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

const DISMISSED_KEY = "ghost-a2hs-dismissed";
const INSTALLED_KEY = "ghost-a2hs-installed";
const SESSION_COUNT_KEY = "gta-mobile-sessions";

export function AddToHomeScreenPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as NavigatorWithStandalone).standalone === true;
    const wasDismissed = window.localStorage.getItem(DISMISSED_KEY) === "1";
    const wasInstalled = window.localStorage.getItem(INSTALLED_KEY) === "1";

    setIsIos(iosDevice);

    if (isStandalone) {
      window.localStorage.setItem(INSTALLED_KEY, "1");
      setShowPrompt(false);
      return;
    }

    if (wasDismissed || wasInstalled) {
      setShowPrompt(false);
      return;
    }

    const sessions = Number(window.localStorage.getItem(SESSION_COUNT_KEY) ?? "0") + 1;
    window.localStorage.setItem(SESSION_COUNT_KEY, String(sessions));

    if (iosDevice && sessions >= 3) {
      setShowPrompt(true);
    }

    const handleInstalled = () => {
      window.localStorage.setItem(INSTALLED_KEY, "1");
      window.localStorage.removeItem(DISMISSED_KEY);
      setDeferredPrompt(null);
      setShowPrompt(false);
    };

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      if (sessions >= 3) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleInstalled);
    };
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
            const choice = await deferredPrompt.userChoice.catch(() => null);
            if (choice?.outcome === "accepted") {
              window.localStorage.setItem(INSTALLED_KEY, "1");
              window.localStorage.removeItem(DISMISSED_KEY);
            }
            setDeferredPrompt(null);
            setShowPrompt(false);
          }}
        >
          Add to Home Screen
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        className="mt-2"
        onClick={() => {
          window.localStorage.setItem(DISMISSED_KEY, "1");
          setShowPrompt(false);
        }}
      >
        Dismiss
      </Button>
    </div>
  );
}
