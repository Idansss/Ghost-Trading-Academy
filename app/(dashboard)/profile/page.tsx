"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { PageTransition } from "@/components/layout/PageTransition";
import { AvatarUploadButton } from "@/components/profile/AvatarUploadButton";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { fetchJson } from "@/lib/client-api";
import { profileSchema } from "@/lib/validators";

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { update } = useSession();
  const { data, isError, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      fetchJson<{
        profile: {
          name: string;
          email: string;
          avatarUrl: string | null;
          role: string;
          accountSize: number | null;
          riskPerTrade: number;
          leaderboardOptIn: boolean;
          emailSignalAlerts: boolean;
          twoFactorEnabled: boolean;
          referralCode: string;
        };
        stats: {
          totalTrades: number;
          totalPnl: number;
          bestMonth: [string, number] | null;
        };
      }>("/api/profile"),
  });
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      avatarUrl: "",
      accountSize: null,
      riskPerTrade: 1,
      leaderboardOptIn: false,
      emailSignalAlerts: true,
      currentPassword: "",
      newPassword: "",
    },
  });

  useEffect(() => {
    if (!data?.profile) return;
    form.reset({
      name: data.profile.name,
      avatarUrl: data.profile.avatarUrl ?? "",
      accountSize: data.profile.accountSize ?? null,
      riskPerTrade: data.profile.riskPerTrade,
      leaderboardOptIn: data.profile.leaderboardOptIn,
      emailSignalAlerts: data.profile.emailSignalAlerts,
      currentPassword: "",
      newPassword: "",
    });
  }, [data?.profile, form]);

  const mutation = useMutation({
    mutationFn: (payload: ProfileValues) =>
      fetchJson("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: async (_response, payload) => {
      toast.success("Profile updated.");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      await update({
        user: {
          name: payload.name,
          avatarUrl: payload.avatarUrl || null,
          accountSize: payload.accountSize ?? null,
          riskPerTrade: payload.riskPerTrade,
        },
      });
    },
  });

  const initials =
    data?.profile.name
      ?.split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("") ?? "AV";
  const avatarPreview = form.watch("avatarUrl") || data?.profile.avatarUrl || "";
  const referralLink =
    typeof window !== "undefined" && data?.profile.referralCode
      ? `${window.location.origin}/auth/register?ref=${data.profile.referralCode}`
      : "";

  if (isError) {
    return (
      <ErrorState
        title="Profile unavailable"
        description="There was a problem loading your account details."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]} />
        <PageHeader
          eyebrow="Profile"
          title="Account Settings"
          description="Update your identity, password, and monitor your lifetime stats."
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(async (values) => {
                  await mutation.mutateAsync(values);
                })}
              >
                <div className="flex items-center gap-4">
                  <AvatarUploadButton
                    name={data?.profile.name}
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
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...form.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label>Avatar URL</Label>
                  <Input
                    {...form.register("avatarUrl")}
                    placeholder="Paste an image URL or use the camera button above"
                  />
                </div>
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
                        Your win rate and trade count will be visible to other members. Your name and avatar will be shown. No PnL amounts are disclosed.
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
                <Button disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <MetricCard label="Total Trades" value={`${data?.stats.totalTrades ?? 0}`} />
              <MetricCard
                label="Total P&L"
                value={`${data?.stats.totalPnl?.toFixed(1) ?? "0"}%`}
                tone={(data?.stats.totalPnl ?? 0) >= 0 ? "positive" : "negative"}
              />
              <MetricCard
                label="Best Month"
                value={data?.stats.bestMonth?.[0] ?? "N/A"}
                helper={
                  data?.stats.bestMonth ? `${data.stats.bestMonth[1].toFixed(1)}%` : "No data"
                }
              />
              <MetricCard
                label="Risk Rule"
                value={`${data?.profile.riskPerTrade?.toFixed(2) ?? "1.00"}%`}
                helper={`Acct size ${data?.profile.accountSize?.toLocaleString("en-US") ?? "Not set"}`}
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Access Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Role: {data?.profile.role}</p>
                <p>Email: {data?.profile.email}</p>
                <p>Account size default: {data?.profile.accountSize?.toLocaleString("en-US") ?? "Not set"}</p>
              </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Two-factor authentication is currently{" "}
                <strong>{data?.profile.twoFactorEnabled ? "enabled" : "disabled"}</strong>.
              </p>
              {!data?.profile.twoFactorEnabled ? (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/auth/2fa/setup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "start" }),
                      });
                      const payload = (await response.json()) as {
                        token: string;
                        qrCodeDataUrl: string;
                        backupCodes: string[];
                      };
                      const code = window.prompt(
                        `Scan QR in your authenticator app.\n\nBackup codes:\n${payload.backupCodes.join("\n")}\n\nEnter current 6-digit code to finish setup:`,
                      );
                      if (!code) return;
                      const verify = await fetch("/api/auth/2fa/setup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "verify",
                          token: payload.token,
                          code,
                        }),
                      });
                      if (!verify.ok) {
                        throw new Error("Failed to verify code.");
                      }
                      toast.success("2FA enabled.");
                      await queryClient.invalidateQueries({ queryKey: ["profile"] });
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to setup 2FA.");
                    }
                  }}
                >
                  Enable 2FA
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await fetch("/api/auth/2fa/disable", { method: "POST" });
                    toast.success("2FA disabled.");
                    await queryClient.invalidateQueries({ queryKey: ["profile"] });
                  }}
                >
                  Disable 2FA
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Refer a Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Share your referral link:
              </p>
              <Input
                readOnly
                value={referralLink}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      referralLink,
                    );
                    toast.success("Referral link copied.");
                  }}
                >
                  Copy link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const text = encodeURIComponent(
                      `Join me on Ghost Trading Academy: ${referralLink}`,
                    );
                    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
                  }}
                >
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
