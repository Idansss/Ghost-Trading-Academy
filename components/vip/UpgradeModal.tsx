"use client";

import { Check, Crown, MessageCircleMore } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

const pricingOptions = [
  {
    id: "monthly",
    title: "Monthly",
    price: "$49 / month",
    description: "Billed monthly, cancel anytime",
    buttonLabel: "Select Monthly",
    featured: false,
  },
  {
    id: "quarterly",
    title: "3 Months",
    price: "$119 / 3 months",
    description: "Save $28 vs monthly",
    buttonLabel: "Select 3 Months",
    featured: true,
  },
];

const features = [
  "All VIP signals with full entry, SL, TP, and reasoning",
  "Daily market outlook and watchlist",
  "Premium education library (PDFs & videos)",
  "Priority trade alerts and TP/SL updates",
  "Member community and weekly recaps",
  "Exclusive position sizing tools",
];

export function UpgradeModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedPlan, setSelectedPlan] = useState("quarterly");
  const contactLink = env.contactLink;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen max-h-screen w-screen max-w-none overflow-y-auto rounded-none border-0 p-0 sm:rounded-none">
        <div className="min-h-screen bg-gradient-to-br from-[color:var(--color-gold-light)] via-background to-background p-6 md:p-10">
          <DialogHeader className="items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[color:var(--color-gold-light)] text-[color:var(--color-gold)]">
              <Crown className="h-12 w-12" />
            </div>
            <DialogTitle className="mt-4 text-3xl">Unlock Apex VIP</DialogTitle>
            <DialogDescription className="max-w-sm text-center">
              Get access to every signal, resource, and premium feature
            </DialogDescription>
          </DialogHeader>

          <div className="mx-auto mt-6 max-w-4xl space-y-3">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-4 w-4 text-[color:var(--color-green)]" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-6 grid max-w-4xl gap-3 md:grid-cols-2">
            {pricingOptions.map((option) => (
              <div
                key={option.id}
                className={cn(
                  "rounded-2xl border p-4 transition-colors",
                  option.featured
                    ? "border-[color:var(--color-gold)] bg-[color:var(--color-gold-light)]"
                    : "border-border bg-card",
                  selectedPlan === option.id && "ring-2 ring-[color:var(--color-gold)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold">{option.title}</p>
                      {option.featured ? (
                        <span className="rounded-full bg-[color:var(--color-gold)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                          Most Popular
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xl font-semibold">{option.price}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant={selectedPlan === option.id ? "default" : "outline"}
                    onClick={() => setSelectedPlan(option.id)}
                  >
                    {option.buttonLabel}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Contact admin to upgrade</p>
            <Button asChild className="mt-4 w-full">
              <a href={contactLink} target="_blank" rel="noreferrer">
                <MessageCircleMore className="mr-2 h-4 w-4" />
                Contact on WhatsApp / Telegram
              </a>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Your subscription is activated manually by the admin within 24 hours
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
