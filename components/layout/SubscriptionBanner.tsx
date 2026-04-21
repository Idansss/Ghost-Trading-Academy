"use client";

import { differenceInCalendarDays } from "date-fns";
import { X } from "lucide-react";
import type { Session } from "next-auth";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export function SubscriptionBanner({
  user,
}: {
  user: Session["user"];
}) {
  const [dismissed, setDismissed] = useState(false);
  const todayKey = new Date().toISOString().slice(0, 10);
  const storageKey = `apex-vip-banner-dismissed-${todayKey}`;

  const bannerState = useMemo(() => {
    if (!user.subscriptionExpiry) {
      return null;
    }

    const daysUntilExpiry = differenceInCalendarDays(
      new Date(user.subscriptionExpiry),
      new Date(),
    );

    if (user.subscriptionStatus === "EXPIRED" || daysUntilExpiry < 0) {
      return {
        tone: "expired" as const,
        dismissible: false,
        message:
          "Your VIP subscription has expired. You no longer have access to VIP content.",
      };
    }

    if (daysUntilExpiry <= 7) {
      return {
        tone: "warning" as const,
        dismissible: true,
        message:
          daysUntilExpiry === 0
            ? "Your VIP subscription expires today. Contact admin to renew."
            : `Your VIP subscription expires in ${daysUntilExpiry} days. Contact admin to renew.`,
      };
    }

    return null;
  }, [user.subscriptionExpiry, user.subscriptionStatus]);

  useEffect(() => {
    if (!bannerState?.dismissible) {
      setDismissed(false);
      return;
    }

    setDismissed(window.localStorage.getItem(storageKey) === "true");
  }, [bannerState?.dismissible, storageKey]);

  if (!bannerState || dismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b px-4 py-3 text-sm sm:px-6 lg:px-8",
        bannerState.tone === "warning"
          ? "border-[color:var(--color-gold)]/20 bg-[color:var(--color-gold-light)] text-[color:var(--color-gold)]"
          : "border-[color:var(--color-red)]/20 bg-[color:var(--color-red-light)] text-[color:var(--color-red)]",
      )}
    >
      <p>{bannerState.message}</p>
      {bannerState.dismissible ? (
        <button
          type="button"
          className="rounded-full p-1 transition-colors hover:bg-black/5"
          onClick={() => {
            window.localStorage.setItem(storageKey, "true");
            setDismissed(true);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
