"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/PageTransition";
// CLAUDE FIX: Replaced the duplicated inline form with the shared ProfileForm component.
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchJson } from "@/lib/client-api";

// CLAUDE FIX: 2FA setup was using window.prompt() which:
//   (a) cannot render the QR code image, making setup impossible
//   (b) is blocked by some browser popup blockers
//   (c) has no way to display the backup codes in a copyable format
// Replaced with a proper Dialog that shows the QR image, backup codes, and
// a verification code input so users can actually complete setup.
type TwoFASetupState = {
  token: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { update } = useSession();
  const [twoFASetup, setTwoFASetup] = useState<TwoFASetupState | null>(null);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAVerifying, setTwoFAVerifying] = useState(false);
  const twoFACodeRef = useRef<HTMLInputElement>(null);
  // CLAUDE FIX: query stays here; initialValues are passed down to ProfileForm.
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
              {/* CLAUDE FIX: Replaced the duplicated inline form with the shared
                  ProfileForm. key resets the form when API data arrives so fields
                  show the real values instead of the empty defaults. */}
              <ProfileForm
                key={data ? "loaded" : "loading"}
                mode="full"
                initialValues={
                  data?.profile ?? {
                    name: "",
                    riskPerTrade: 1,
                    leaderboardOptIn: false,
                    emailSignalAlerts: true,
                  }
                }
                onSuccess={async (payload) => {
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
                  // Server layouts read `auth()` once per RSC render; refresh so Topbar/Sidebar get the new JWT.
                  router.refresh();
                }}
              />
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
                      if (!response.ok) throw new Error("Failed to start 2FA setup.");
                      const payload = (await response.json()) as TwoFASetupState;
                      setTwoFASetup(payload);
                      setTwoFACode("");
                      // Focus the code input after dialog opens
                      setTimeout(() => twoFACodeRef.current?.focus(), 100);
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to start 2FA setup.");
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
                <Button variant="outline" asChild>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me on The Thesis Desk: ${referralLink}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Share
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>

      {/* CLAUDE FIX: 2FA setup dialog — replaces window.prompt so users can
          actually scan the QR code and copy their backup codes. */}
      <Dialog
        open={twoFASetup !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTwoFASetup(null);
            setTwoFACode("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set up two-factor authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app (e.g. Google Authenticator,
              Authy), then enter the 6-digit code to confirm.
            </DialogDescription>
          </DialogHeader>

          {twoFASetup ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                {/* CLAUDE FIX: QR code is a base64 data: URL generated server-side.
                    next/image cannot pass data: URLs through the image CDN — use
                    a native <img> so the QR code actually renders. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={twoFASetup.qrCodeDataUrl}
                  alt="2FA QR code — scan with your authenticator app"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              </div>

              <div className="rounded-2xl border border-border bg-muted/40 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Backup codes — save these somewhere safe
                </p>
                <div className="grid grid-cols-2 gap-1 font-mono text-xs">
                  {twoFASetup.backupCodes.map((code) => (
                    <span key={code} className="rounded bg-background px-2 py-0.5 tabular-nums">
                      {code}
                    </span>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={async () => {
                    await navigator.clipboard.writeText(twoFASetup.backupCodes.join("\n"));
                    toast.success("Backup codes copied to clipboard.");
                  }}
                >
                  Copy backup codes
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twofa-code">Verification code</Label>
                <Input
                  id="twofa-code"
                  ref={twoFACodeRef}
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTwoFASetup(null);
                setTwoFACode("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={twoFACode.length !== 6 || twoFAVerifying}
              onClick={async () => {
                if (!twoFASetup) return;
                setTwoFAVerifying(true);
                try {
                  const verify = await fetch("/api/auth/2fa/setup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "verify",
                      token: twoFASetup.token,
                      code: twoFACode,
                    }),
                  });
                  if (!verify.ok) {
                    toast.error("Invalid code — try again.");
                    return;
                  }
                  toast.success("Two-factor authentication enabled.");
                  setTwoFASetup(null);
                  setTwoFACode("");
                  await queryClient.invalidateQueries({ queryKey: ["profile"] });
                } catch {
                  toast.error("Failed to verify code. Please try again.");
                } finally {
                  setTwoFAVerifying(false);
                }
              }}
            >
              {twoFAVerifying ? "Verifying..." : "Enable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
