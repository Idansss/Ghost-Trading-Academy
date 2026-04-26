"use client";

// CLAUDE FIX: Extracted from app/(dashboard)/profile/page.tsx so both the
// profile page and the onboarding flow share one form, one save path, and one
// validation schema — eliminating the "Validation failed" bug where the onboarding
// form omitted riskPerTrade which was required by profileSchema.

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { AvatarUploadButton } from "@/components/profile/AvatarUploadButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { fetchJson } from "@/lib/client-api";
import { profileSchema } from "@/lib/validators";

type ProfileValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  mode?: "full" | "onboarding";
  initialValues: {
    name: string;
    avatarUrl?: string | null;
    accountSize?: number | null;
    riskPerTrade?: number | null;
    leaderboardOptIn?: boolean;
    emailSignalAlerts?: boolean;
  };
  onSuccess?: (values: ProfileValues) => void | Promise<void>;
}

export function ProfileForm({ mode = "full", initialValues, onSuccess }: ProfileFormProps) {
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialValues.name,
      avatarUrl: initialValues.avatarUrl ?? "",
      // CLAUDE FIX: Always include hidden fields with their existing values so the
      // server never receives an incomplete payload — this is what caused the
      // "Validation failed" error in the onboarding flow.
      accountSize: initialValues.accountSize ?? null,
      riskPerTrade: initialValues.riskPerTrade ?? 1,
      leaderboardOptIn: initialValues.leaderboardOptIn ?? false,
      emailSignalAlerts: initialValues.emailSignalAlerts ?? true,
      currentPassword: "",
      newPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: ProfileValues) =>
      fetchJson("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: async (_response, values) => {
      await onSuccess?.(values);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const watchedName = form.watch("name");
  const initials = useMemo(
    () =>
      (watchedName || initialValues.name)
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "GV",
    [watchedName, initialValues.name],
  );
  const avatarPreview = form.watch("avatarUrl") || "";

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        await mutation.mutateAsync(values);
      })}
    >
      {mode === "onboarding" ? (
        <div className="flex items-center gap-4 rounded-3xl border border-border p-5">
          <AvatarUploadButton
            name={watchedName}
            initials={initials}
            imageUrl={avatarPreview}
            onUpload={(url) => {
              form.setValue("avatarUrl", url, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
          />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Profile preview</p>
            <p className="text-sm text-muted-foreground">
              This is the identity shown around the desk and community.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <AvatarUploadButton
            name={watchedName}
            initials={initials}
            imageUrl={avatarPreview}
            onUpload={(url) => {
              form.setValue("avatarUrl", url, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
          />
        </div>
      )}

      <div className={mode === "onboarding" ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
        <div className="space-y-2">
          <Label>{mode === "onboarding" ? "Display name" : "Name"}</Label>
          <Input
            {...form.register("name")}
            placeholder={mode === "onboarding" ? "Abass Ibrahim" : undefined}
          />
          {form.formState.errors.name ? (
            <p className="text-xs text-[color:var(--color-red)]">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label>Avatar URL</Label>
          <Input
            {...form.register("avatarUrl")}
            placeholder={
              mode === "onboarding"
                ? "Optional image URL"
                : "Paste an image URL or use the camera button above"
            }
          />
        </div>
      </div>

      {mode === "full" && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Account Size</Label>
              <Input
                type="number"
                step="any"
                placeholder="10000"
                {...form.register("accountSize", {
                  setValueAs: (value) => (value === "" ? null : Number(value)),
                })}
              />
              <p className="text-xs text-muted-foreground">
                Used as the default balance in the risk calculator.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Risk Per Trade %</Label>
              <Input
                type="number"
                step="any"
                {...form.register("riskPerTrade", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Applied automatically on the calculator and signal sizing sheet.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Email signal alerts</p>
                <p className="text-xs text-muted-foreground">
                  Email me when new signals are posted.
                </p>
              </div>
              <Switch
                checked={form.watch("emailSignalAlerts")}
                onCheckedChange={(checked) =>
                  form.setValue("emailSignalAlerts", checked, {
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
              />
            </div>
          </div>
          <div className="rounded-2xl border border-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Appear on the leaderboard</p>
                <p className="text-xs text-muted-foreground">
                  Your win rate and trade count will be visible to other members. Your name and
                  avatar will be shown. No PnL amounts are disclosed.
                </p>
              </div>
              <Switch
                checked={form.watch("leaderboardOptIn")}
                onCheckedChange={(checked) =>
                  form.setValue("leaderboardOptIn", checked, {
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" {...form.register("currentPassword")} />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" {...form.register("newPassword")} />
          </div>
        </>
      )}

      <Button disabled={mutation.isPending}>
        {mutation.isPending
          ? "Saving..."
          : mode === "onboarding"
            ? "Save and continue"
            : "Save Changes"}
      </Button>
    </form>
  );
}
