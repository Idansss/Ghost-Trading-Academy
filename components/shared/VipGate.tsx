"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useState } from "react";
import { UpgradeModal } from "@/components/vip/UpgradeModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function VipGate({
  enabled,
  children,
  title = "VIP Members Only",
  description = "This content is exclusive to VIP members",
  variant = "page",
}: {
  enabled: boolean;
  children: React.ReactNode;
  title?: string;
  description?: string;
  variant?: "page" | "card";
}) {
  const [open, setOpen] = useState(false);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-[28px]">
        <div className="pointer-events-none select-none blur-sm">{children}</div>
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute inset-0 grid place-items-center bg-background/40"
        >
          <Card
            className={cn(
              "mx-4 border-primary/20 bg-background/95 text-center backdrop-blur",
              variant === "page" ? "max-w-md p-6" : "max-w-[260px] p-4",
            )}
          >
            <div
              className={cn(
                "mx-auto grid place-items-center rounded-full bg-primary/10 text-primary",
                variant === "page" ? "h-16 w-16" : "h-12 w-12",
              )}
            >
              <Lock className={cn(variant === "page" ? "h-8 w-8" : "h-6 w-6")} />
            </div>
            <div className={cn("space-y-2", variant === "page" ? "mt-4" : "mt-3")}>
              <h3 className={cn("font-semibold", variant === "page" ? "text-xl" : "text-base")}>
                {title}
              </h3>
              <p className={cn("text-muted-foreground", variant === "page" ? "text-sm" : "text-xs")}>
                {description}
              </p>
            </div>
            <Button
              className={cn(variant === "page" ? "mt-5" : "mt-4 h-9 px-4 text-xs")}
              onClick={() => setOpen(true)}
            >
              Upgrade to VIP
            </Button>
          </Card>
        </motion.div>
      </div>

      <UpgradeModal open={open} onOpenChange={setOpen} />
    </>
  );
}
