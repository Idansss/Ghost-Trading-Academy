"use client";

import Script from "next/script";
import { BellRing, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/client-api";

const SESSION_STORAGE_KEY = "ghost-trading-academy-push-prompt-dismissed";

type OneSignalSDK = {
  init: (options: Record<string, unknown>) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  Notifications: {
    requestPermission: () => Promise<void>;
    permission?: boolean;
    isPushSupported?: () => boolean | Promise<boolean>;
  };
  User: {
    PushSubscription: {
      id: string | null;
      addEventListener?: (event: "change", listener: () => void) => void;
    };
  };
};

declare global {
  interface Window {
    OneSignal?: OneSignalSDK;
    OneSignalDeferred?: Array<(OneSignal: OneSignalSDK) => void>;
    __ghostOneSignalInitialized?: boolean;
  }
}

export function PushPermissionPrompt({
  appId,
  userId,
}: {
  appId?: string;
  userId: string;
}) {
  const [isReady, setIsReady] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [dismissed, setDismissed] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const lastSyncedIdRef = useRef<string | null>(null);

  const syncMutation = useMutation({
    mutationFn: (pushPlayerId: string | null) =>
      fetchJson<{ ok: true }>("/api/notifications/push-subscription", {
        method: "PATCH",
        body: JSON.stringify({ pushPlayerId }),
      }),
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setDismissed(sessionStorage.getItem(SESSION_STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    if (!appId || typeof window === "undefined") {
      return;
    }

    const refreshState = async (oneSignal: OneSignalSDK) => {
      const permission =
        typeof Notification !== "undefined" ? Notification.permission : "default";
      const supportedResult =
        typeof oneSignal.Notifications.isPushSupported === "function"
          ? await oneSignal.Notifications.isPushSupported()
          : "serviceWorker" in navigator;
      const subscriptionId = oneSignal.User.PushSubscription.id ?? null;

      setPermissionState(permission);
      setIsSupported(Boolean(supportedResult));
      setIsReady(true);

      if (subscriptionId !== lastSyncedIdRef.current) {
        lastSyncedIdRef.current = subscriptionId;
        syncMutation.mutate(subscriptionId);
      }
    };

    const deferred = (window.OneSignalDeferred = window.OneSignalDeferred ?? []);

    deferred.push(async (oneSignal) => {
      if (!window.__ghostOneSignalInitialized) {
        await oneSignal.init({
          appId,
          allowLocalhostAsSecureOrigin: true,
          autoResubscribe: true,
          notifyButton: {
            enable: false,
          },
          serviceWorkerPath: "/OneSignalSDKWorker.js",
          serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
        });
        window.OneSignal = oneSignal;
        window.__ghostOneSignalInitialized = true;
      }

      await oneSignal.login(userId);
      await refreshState(oneSignal);
      oneSignal.User.PushSubscription.addEventListener?.("change", () => {
        void refreshState(oneSignal);
      });
    });
  }, [appId, syncMutation, userId]);

  const shouldShow = useMemo(
    () =>
      Boolean(appId) &&
      isReady &&
      isSupported &&
      permissionState === "default" &&
      !dismissed,
    [appId, dismissed, isReady, isSupported, permissionState],
  );

  if (!appId) {
    return null;
  }

  return (
    <>
      <Script
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
      />
      {shouldShow ? (
        <div className="border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                <BellRing className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Turn on signal alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get instant browser notifications when a new signal drops or a target gets hit.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  sessionStorage.setItem(SESSION_STORAGE_KEY, "1");
                  setDismissed(true);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Not now
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isRequesting}
                onClick={async () => {
                  if (!window.OneSignal) {
                    toast.error("Push notifications are still loading.");
                    return;
                  }

                  setIsRequesting(true);

                  try {
                    await window.OneSignal.Notifications.requestPermission();
                    setPermissionState(
                      typeof Notification !== "undefined" ? Notification.permission : "default",
                    );
                    sessionStorage.setItem(SESSION_STORAGE_KEY, "1");
                    setDismissed(true);
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Unable to enable push notifications.",
                    );
                  } finally {
                    setIsRequesting(false);
                  }
                }}
              >
                {isRequesting ? "Enabling..." : "Enable Alerts"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
