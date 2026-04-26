"use client";

// CLAUDE IMPROVEMENT: Phase 2 — Admin TradingView integration management page.
// Lets admins generate/rotate their webhook secret, view the alert format guide,
// and inspect recent webhook activity without needing database access.

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Zap,
  Power,
  PowerOff,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type WebhookConfig = {
  id: string;
  webhookSecret: string;
  isActive: boolean;
  lastTriggeredAt: string | null;
  triggerCount: number;
  createdAt: string;
};

type WebhookLog = {
  id: string;
  status: "SUCCESS" | "INVALID_SECRET" | "INVALID_PAYLOAD" | "RATE_LIMITED" | "ERROR";
  signalId: string | null;
  errorMessage: string | null;
  ipAddress: string | null;
  createdAt: string;
};

const ENDPOINT_PATH = "/api/webhooks/tradingview";

function getAppUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "";
}

const STATUS_META: Record<WebhookLog["status"], { label: string; variant: "success" | "danger" | "warning" | "muted" }> = {
  SUCCESS: { label: "Success", variant: "success" },
  INVALID_SECRET: { label: "Bad secret", variant: "danger" },
  INVALID_PAYLOAD: { label: "Bad payload", variant: "warning" },
  RATE_LIMITED: { label: "Rate limited", variant: "warning" },
  ERROR: { label: "Error", variant: "danger" },
};

export default function TradingViewIntegrationPage() {
  const queryClient = useQueryClient();
  const [showSecret, setShowSecret] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  const configQuery = useQuery({
    queryKey: ["admin-tv-webhook"],
    queryFn: () => fetchJson<{ data: WebhookConfig }>("/api/admin/tradingview/webhook").then((r) => r.data),
  });

  const logsQuery = useQuery({
    queryKey: ["admin-tv-webhook-logs"],
    queryFn: () =>
      fetchJson<{ data: { logs: WebhookLog[] } }>("/api/admin/tradingview/webhook/logs?limit=50").then(
        (r) => r.data.logs,
      ),
    refetchInterval: 30_000,
  });

  const regenerateMutation = useMutation({
    mutationFn: () =>
      fetchJson<{ data: WebhookConfig }>("/api/admin/tradingview/webhook/regenerate", { method: "POST" }).then(
        (r) => r.data,
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin-tv-webhook"], data);
      setConfirmRegenerate(false);
      toast.success("Webhook secret regenerated. Update your TradingView alerts.");
    },
    onError: () => {
      toast.error("Failed to regenerate secret.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: () =>
      fetchJson<{ data: WebhookConfig }>("/api/admin/tradingview/webhook/toggle", { method: "PATCH" }).then(
        (r) => r.data,
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin-tv-webhook"], data);
      toast.success(data.isActive ? "Webhook enabled." : "Webhook disabled.");
    },
    onError: () => {
      toast.error("Failed to toggle webhook status.");
    },
  });

  const copyText = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard.`);
    } catch {
      toast.error("Copy failed — try selecting and copying manually.");
    }
  }, []);

  const config = configQuery.data;
  const webhookUrl = `${getAppUrl()}${ENDPOINT_PATH}`;
  const secret = config?.webhookSecret ?? "";

  const samplePayload = JSON.stringify(
    {
      secret: secret || "tv_YOUR_SECRET_HERE",
      coin: "{{ticker}}",
      direction: "LONG",
      entry: "{{close}}",
      stopLoss: 67000,
      tp1: 68500,
      tp2: 69200,
      tp3: 70000,
      riskLevel: "MEDIUM",
      timeframe: "{{interval}}",
      reasoning: "Confluence triggered on 4H",
    },
    null,
    2,
  );

  return (
    <div className="space-y-6">
      {/* ─── Page header ─── */}
      <div>
        <h1 className="text-2xl font-semibold">TradingView Integration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your TradingView alerts to auto-publish signals to the desk.
        </p>
      </div>

      {/* ─── Status banner ─── */}
      {config ? (
        <div
          className={cn(
            "flex items-center justify-between gap-4 rounded-2xl border px-5 py-4",
            config.isActive
              ? "border-[color:var(--color-green)]/30 bg-[color:var(--color-green-light)]"
              : "border-border bg-muted/40",
          )}
        >
          <div className="flex items-center gap-3">
            {config.isActive ? (
              <Zap className="h-4 w-4 text-[color:var(--color-green)] shrink-0" />
            ) : (
              <PowerOff className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">
                {config.isActive ? "Webhook is active" : "Webhook is disabled"}
              </p>
              <p className="text-xs text-muted-foreground">
                {config.triggerCount} signal{config.triggerCount !== 1 ? "s" : ""} published
                {config.lastTriggeredAt
                  ? ` · Last: ${new Date(config.lastTriggeredAt).toLocaleString()}`
                  : ""}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-2"
            disabled={toggleMutation.isPending}
            onClick={() => toggleMutation.mutate()}
          >
            {config.isActive ? (
              <>
                <PowerOff className="h-3.5 w-3.5" />
                Disable
              </>
            ) : (
              <>
                <Power className="h-3.5 w-3.5" />
                Enable
              </>
            )}
          </Button>
        </div>
      ) : configQuery.isLoading ? (
        <Skeleton className="h-[72px] w-full rounded-2xl" />
      ) : null}

      {/* ─── Webhook URL card ─── */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
          <CardDescription>
            Paste this URL into your TradingView alert under{" "}
            <strong>Notifications → Webhook URL</strong>. The URL itself is not secret — your
            secret lives in the JSON payload below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={webhookUrl} readOnly className="font-mono text-xs bg-muted/40" />
            <Button
              variant="outline"
              onClick={() => copyText(webhookUrl, "Webhook URL")}
              className="shrink-0"
              aria-label="Copy webhook URL"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Secret card ─── */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Secret</CardTitle>
          <CardDescription>
            Include this in every TradingView alert payload as the <code className="text-xs bg-muted px-1 py-0.5 rounded">secret</code> field.
            Keep it private — anyone who has it can publish signals on your behalf.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configQuery.isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="flex gap-2">
              <Input
                value={secret}
                readOnly
                type={showSecret ? "text" : "password"}
                className="font-mono text-xs bg-muted/40"
                aria-label="Webhook secret"
              />
              <Button
                variant="outline"
                onClick={() => setShowSecret((v) => !v)}
                className="shrink-0"
                aria-label={showSecret ? "Hide secret" : "Show secret"}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                onClick={() => copyText(secret, "Secret")}
                className="shrink-0"
                aria-label="Copy secret"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Regenerate — two-click to prevent accidental rotations */}
          <div className="flex items-center gap-3 pt-1">
            {confirmRegenerate ? (
              <>
                <p className="text-xs text-destructive flex-1">
                  This will invalidate all existing TradingView alerts using the current secret.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={regenerateMutation.isPending}
                  onClick={() => regenerateMutation.mutate()}
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Confirm regenerate
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmRegenerate(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => setConfirmRegenerate(true)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate secret
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Alert format guide ─── */}
      <Card>
        <CardHeader>
          <CardTitle>Alert message format</CardTitle>
          <CardDescription>
            Paste this JSON into your TradingView alert message field. TradingView replaces{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{ticker}}"}</code>,{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{close}}"}</code>, and{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{interval}}"}</code> with the
            live values from your chart.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <pre className="rounded-xl bg-muted p-4 text-xs overflow-x-auto leading-relaxed">
              {samplePayload}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute right-3 top-3 gap-1.5 text-xs"
              onClick={() => copyText(samplePayload, "Alert template")}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The <code className="bg-muted px-1 py-0.5 rounded">entry</code> field accepts a number
            (e.g. <code className="bg-muted px-1 py-0.5 rounded">{"{{close}}"}</code>). Optionally add{" "}
            <code className="bg-muted px-1 py-0.5 rounded">entryZoneLow</code> and{" "}
            <code className="bg-muted px-1 py-0.5 rounded">entryZoneHigh</code> for a zone display.
          </p>
        </CardContent>
      </Card>

      {/* ─── Setup guide ─── */}
      <Card>
        <CardHeader>
          <CardTitle>How to set up</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm list-decimal list-inside text-muted-foreground">
            <li>Open TradingView and load the chart for the coin you want to alert on.</li>
            <li>Add your indicator and configure your entry/stop/target logic.</li>
            <li>
              Right-click the chart and select <strong>Add alert</strong> (or press{" "}
              <kbd className="px-1.5 py-0.5 rounded border bg-muted text-foreground text-xs">Alt+A</kbd>).
            </li>
            <li>
              Under <strong>Notifications</strong>, enable <strong>Webhook URL</strong> and paste the
              URL from above.
            </li>
            <li>In the <strong>Message</strong> field, paste the JSON template above.</li>
            <li>Replace the hardcoded stop/TP values with your indicator&apos;s outputs or plot values.</li>
            <li>Click <strong>Create</strong>.</li>
          </ol>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              TradingView webhook alerts require a <strong>Pro plan</strong> or higher.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ─── Activity log ─── */}
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            {logsQuery.data
              ? `Last ${logsQuery.data.length} webhook events`
              : "Webhook events will appear here"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : !logsQuery.data?.length ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No webhook events yet.</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Events will appear here after TradingView fires an alert to your webhook URL.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logsQuery.data.map((log) => {
                const meta = STATUS_META[log.status];
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {log.status === "SUCCESS" ? (
                        <CheckCircle2 className="h-4 w-4 text-[color:var(--color-green)] shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={meta.variant} className="text-[11px]">
                            {meta.label}
                          </Badge>
                          {log.signalId ? (
                            <a
                              href={`/signals/${log.signalId}`}
                              className="text-xs text-primary hover:underline truncate"
                            >
                              View signal
                            </a>
                          ) : null}
                          {log.errorMessage ? (
                            <span className="text-xs text-muted-foreground truncate">
                              {log.errorMessage}
                            </span>
                          ) : null}
                        </div>
                        {log.ipAddress ? (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            from {log.ipAddress}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
