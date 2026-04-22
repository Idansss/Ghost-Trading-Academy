"use client";

import { Trophy } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { memberWinSchema } from "@/lib/validators";
import { fetchJson } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type WinValues = z.infer<typeof memberWinSchema>;

type NewWin = {
  id: string;
  userId: string;
  coin: string;
  pnlPercent: number;
  message: string;
  likesCount: number;
  isApproved: boolean;
  createdAt: string;
  user: { name: string; avatarUrl: string | null };
};

export function ShareWinModal({
  userName,
  userAvatarUrl,
  onWinShared,
}: {
  userName: string;
  userAvatarUrl: string | null;
  onWinShared: (win: NewWin) => void;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<WinValues>({
    resolver: zodResolver(memberWinSchema),
    defaultValues: { coin: "", pnlPercent: 0, message: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const win = await fetchJson<NewWin>("/api/member-wins", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Win shared! It will appear once approved by admin.");
      onWinShared({ ...win, user: { name: userName, avatarUrl: userAvatarUrl } });
      form.reset();
      setOpen(false);
    } catch {
      toast.error("Could not share your win. Try again.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Trophy className="h-4 w-4" />
          Share a Win
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share a Win 🏆</DialogTitle>
          <DialogDescription>
            Celebrate a profitable trade with the community. Wins are reviewed before appearing publicly.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="win-coin">Trading Pair</Label>
            <Input
              id="win-coin"
              placeholder="e.g. BTC/USDT"
              {...form.register("coin")}
            />
            {form.formState.errors.coin && (
              <p className="text-xs text-[color:var(--color-red)]">{form.formState.errors.coin.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="win-pnl">P&L %</Label>
            <Input
              id="win-pnl"
              type="number"
              step="any"
              placeholder="e.g. 4.5"
              {...form.register("pnlPercent", { valueAsNumber: true })}
            />
            {form.formState.errors.pnlPercent && (
              <p className="text-xs text-[color:var(--color-red)]">{form.formState.errors.pnlPercent.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="win-message">Your message</Label>
            <Textarea
              id="win-message"
              placeholder="Briefly describe the setup and what you executed well..."
              rows={3}
              {...form.register("message")}
            />
            {form.formState.errors.message && (
              <p className="text-xs text-[color:var(--color-red)]">{form.formState.errors.message.message}</p>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Sharing..." : "Share Win"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
