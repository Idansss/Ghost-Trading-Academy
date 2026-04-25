"use client";

import { ImageIcon, Trophy, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { memberWinSchema } from "@/lib/validators";
import { fetchJson } from "@/lib/client-api";
import { uploadFileToSupabaseStorage } from "@/lib/storage/upload-client";
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
  imageUrl?: string | null;
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<WinValues>({
    resolver: zodResolver(memberWinSchema),
    defaultValues: { coin: "", pnlPercent: 0, message: "", imageUrl: null },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const url = await uploadFileToSupabaseStorage(file, "memberWin");
      form.setValue("imageUrl", url);
      toast.success("Image uploaded.");
    } catch {
      toast.error("Could not upload image. Try again.");
      setImagePreview(null);
      form.setValue("imageUrl", null);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue("imageUrl", null);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const win = await fetchJson<NewWin>("/api/member-wins", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Win shared! It will appear once approved by admin.");
      onWinShared({ ...win, user: { name: userName, avatarUrl: userAvatarUrl } });
      form.reset();
      setImagePreview(null);
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
            Celebrate a profitable trade with the community. Wins are reviewed before appearing
            publicly.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="win-coin">Trading Pair</Label>
            <Input id="win-coin" placeholder="e.g. BTC/USDT" {...form.register("coin")} />
            {form.formState.errors.coin && (
              <p className="text-xs text-[color:var(--color-red)]">
                {form.formState.errors.coin.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="win-pnl">P&amp;L %</Label>
            <Input
              id="win-pnl"
              type="number"
              step="any"
              placeholder="e.g. 4.5"
              {...form.register("pnlPercent", { valueAsNumber: true })}
            />
            {form.formState.errors.pnlPercent && (
              <p className="text-xs text-[color:var(--color-red)]">
                {form.formState.errors.pnlPercent.message}
              </p>
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
              <p className="text-xs text-[color:var(--color-red)]">
                {form.formState.errors.message.message}
              </p>
            )}
          </div>

          {/* Chart / screenshot upload */}
          <div className="space-y-2">
            <Label>Chart Screenshot (optional)</Label>
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                {/* CLAUDE FIX: blob: URLs are local object URLs created by URL.createObjectURL —
                    next/image cannot optimize them (they never hit the CDN). Native <img> is
                    the correct element here. eslint-disable needed to suppress the lint rule. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Win screenshot preview"
                  className="h-40 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
                    Uploading…
                  </div>
                )}
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                <ImageIcon className="h-6 w-6" />
                <span>Click to attach a chart screenshot</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageChange}
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setOpen(false);
                setImagePreview(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={form.formState.isSubmitting || isUploading}
            >
              {form.formState.isSubmitting ? "Sharing…" : "Share Win"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
