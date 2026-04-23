"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ExternalLink, Globe, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { z } from "zod";
import { PageTransition } from "@/components/layout/PageTransition";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORTED_TICKER_SYMBOLS } from "@/lib/constants";
import { fetchJson } from "@/lib/client-api";
import { landingPageConfigSchema, siteConfigSchema } from "@/lib/validators";

type SiteConfigValues = z.infer<typeof siteConfigSchema>;
type LandingPageValues = z.infer<typeof landingPageConfigSchema>;

type SiteConfig = {
  id: string;
  tickerSymbols: string[];
  heroHeadline: string | null;
  heroSubheadline: string | null;
  ctaLabel: string;
  ctaUrl: string;
  isWaitlistMode: boolean;
  accentColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  platformName: string;
  supportEmail: string | null;
  telegramLink: string | null;
  twitterLink: string | null;
  discordLink: string | null;
  defaultTimezone: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
};

export default function AdminSiteConfigPage() {
  const queryClient = useQueryClient();

  const tickerForm = useForm<SiteConfigValues>({
    resolver: zodResolver(siteConfigSchema),
    defaultValues: { tickerSymbols: [] },
  });

  const landingForm = useForm<LandingPageValues>({
    resolver: zodResolver(landingPageConfigSchema),
    defaultValues: {
      heroHeadline: "",
      heroSubheadline: "",
      ctaLabel: "Apply for Access",
      ctaUrl: "/auth/login",
      isWaitlistMode: false,
    },
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-site-config"],
    queryFn: () => fetchJson<{ config: SiteConfig }>("/api/admin/site-config"),
  });

  useEffect(() => {
    if (!data?.config) return;
    const cfg = data.config;
    tickerForm.reset({ tickerSymbols: cfg.tickerSymbols });
    landingForm.reset({
      heroHeadline: cfg.heroHeadline ?? "",
      heroSubheadline: cfg.heroSubheadline ?? "",
      ctaLabel: cfg.ctaLabel,
      ctaUrl: cfg.ctaUrl,
      isWaitlistMode: cfg.isWaitlistMode,
    });
  }, [data?.config, tickerForm, landingForm]);

  const tickerMutation = useMutation({
    mutationFn: (payload: SiteConfigValues) =>
      fetchJson<{ config: SiteConfig }>("/api/admin/site-config", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: async ({ config }) => {
      toast.success("Ticker symbols updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin-site-config"] });
      tickerForm.reset({ tickerSymbols: config.tickerSymbols });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const landingMutation = useMutation({
    mutationFn: (payload: LandingPageValues) =>
      fetchJson<{ config: SiteConfig }>("/api/admin/site-config", {
        method: "PATCH",
        body: JSON.stringify({
          ...payload,
          heroHeadline: payload.heroHeadline || null,
          heroSubheadline: payload.heroSubheadline || null,
        }),
      }),
    onSuccess: async () => {
      toast.success("Landing page updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin-site-config"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const selectedSymbols = tickerForm.watch("tickerSymbols");
  const isWaitlistMode = landingForm.watch("isWaitlistMode");
  const [platformName, setPlatformName] = useState("");
  const [accentColor, setAccentColor] = useState("#D4A017");
  const [supportEmail, setSupportEmail] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [twitterLink, setTwitterLink] = useState("");
  const [discordLink, setDiscordLink] = useState("");
  const [defaultTimezone, setDefaultTimezone] = useState("UTC");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  useEffect(() => {
    if (!data?.config) return;
    setPlatformName(data.config.platformName ?? "");
    setAccentColor(data.config.accentColor ?? "#D4A017");
    setSupportEmail(data.config.supportEmail ?? "");
    setTelegramLink(data.config.telegramLink ?? "");
    setTwitterLink(data.config.twitterLink ?? "");
    setDiscordLink(data.config.discordLink ?? "");
    setDefaultTimezone(data.config.defaultTimezone ?? "UTC");
    setMaintenanceMode(Boolean(data.config.maintenanceMode));
    setMaintenanceMessage(data.config.maintenanceMessage ?? "");
  }, [data?.config]);

  const saveConfigPatch = async (payload: Record<string, unknown>, successMessage: string) => {
    await fetchJson("/api/admin/site-config", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    toast.success(successMessage);
    await queryClient.invalidateQueries({ queryKey: ["admin-site-config"] });
  };

  if (isError) {
    return (
      <ErrorState
        title="Site config unavailable"
        description="There was a problem loading the site settings."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Site Config" }]} />
        <PageHeader
          eyebrow="Admin"
          title="Site Config"
          description="Control the landing page copy, CTA, and live market ticker."
        />

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="landing">Landing</TabsTrigger>
            <TabsTrigger value="ticker">Ticker</TabsTrigger>
          </TabsList>

          <TabsContent value="landing">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <CardTitle>Landing Page</CardTitle>
                </div>
                <CardDescription>
                  Edit public-facing landing copy without a deploy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-12 rounded-2xl bg-muted/50" />
                    ))}
                  </div>
                ) : (
                  <form
                    className="space-y-5"
                    onSubmit={landingForm.handleSubmit(async (values) => {
                      await landingMutation.mutateAsync(values);
                    })}
                  >
                <div className="space-y-2">
                  <Label htmlFor="heroHeadline">Hero Headline</Label>
                  <Input
                    id="heroHeadline"
                    placeholder="Trade with the Ghost Desk. Stay Ahead of the Market."
                    {...landingForm.register("heroHeadline")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to use the built-in default headline.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heroSubheadline">Hero Subheadline</Label>
                  <Textarea
                    id="heroSubheadline"
                    rows={3}
                    placeholder="Institutional-grade crypto signals, a professional trading journal..."
                    {...landingForm.register("heroSubheadline")}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ctaLabel">CTA Button Label</Label>
                    <Input
                      id="ctaLabel"
                      placeholder="Apply for Access"
                      {...landingForm.register("ctaLabel")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ctaUrl">CTA URL</Label>
                    <Input
                      id="ctaUrl"
                      placeholder="/auth/login"
                      {...landingForm.register("ctaUrl")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use a relative path (e.g. /auth/login) or an external URL for a Typeform /
                      waitlist.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Waitlist mode</p>
                    <p className="text-xs text-muted-foreground">
                      When enabled, the CTA reads as a waitlist form rather than a direct login
                      link. The CTA URL above will be used.
                    </p>
                  </div>
                  <Switch
                    checked={isWaitlistMode}
                    onCheckedChange={(val) => landingForm.setValue("isWaitlistMode", val)}
                    aria-label="Toggle waitlist mode"
                  />
                </div>

                    <div className="flex items-center gap-3">
                      <Button type="submit" disabled={landingMutation.isPending}>
                        {landingMutation.isPending ? "Saving..." : "Save landing page"}
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/" target="_blank">
                          <ExternalLink className="mr-2 h-3.5 w-3.5" />
                          Preview landing page
                        </Link>
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ticker">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Ticker Symbols</CardTitle>
                <CardDescription>
                  Control which live market symbols appear in the dashboard ticker bar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="h-14 rounded-2xl bg-muted/50" />
                    ))}
                  </div>
                ) : (
                  <form
                    className="space-y-6"
                    onSubmit={tickerForm.handleSubmit(async (values) => {
                      await tickerMutation.mutateAsync(values);
                    })}
                  >
                <div className="grid gap-3 sm:grid-cols-2">
                  {SUPPORTED_TICKER_SYMBOLS.map((item) => {
                    const checked = selectedSymbols.includes(item.symbol);

                    return (
                      <label
                        key={item.symbol}
                        className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 transition hover:border-primary/30 hover:bg-accent/40"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.symbol}</p>
                        </div>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(nextChecked) => {
                            const current = tickerForm.getValues("tickerSymbols");
                            tickerForm.setValue(
                              "tickerSymbols",
                              nextChecked === true
                                ? Array.from(new Set([...current, item.symbol]))
                                : current.filter((symbol) => symbol !== item.symbol),
                              { shouldDirty: true, shouldTouch: true, shouldValidate: true },
                            );
                          }}
                          aria-label={`Toggle ${item.label} ticker`}
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedSymbols.map((symbol) => (
                    <Badge key={symbol} variant="muted">
                      {symbol}
                    </Badge>
                  ))}
                </div>

                    <div className="flex items-center gap-3">
                      <Button type="submit" disabled={tickerMutation.isPending}>
                        {tickerMutation.isPending ? "Saving..." : "Save ticker config"}
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Mobile shows the first three selected symbols. Desktop shows all.
                      </p>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="platform-name">Platform Name</Label>
                    <Input
                      id="platform-name"
                      value={platformName}
                      onChange={(event) => setPlatformName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input
                      id="support-email"
                      type="email"
                      value={supportEmail}
                      onChange={(event) => setSupportEmail(event.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-timezone">Default Timezone</Label>
                  <Input
                    id="default-timezone"
                    value={defaultTimezone}
                    onChange={(event) => setDefaultTimezone(event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  onClick={async () => {
                    await saveConfigPatch(
                      {
                        platformName,
                        supportEmail: supportEmail || null,
                        defaultTimezone: defaultTimezone || "UTC",
                      },
                      "General settings saved.",
                    );
                  }}
                >
                  Save general settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <Input
                    id="accent-color"
                    type="color"
                    value={accentColor}
                    onChange={(event) => setAccentColor(event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  onClick={async () => {
                    await saveConfigPatch({ accentColor }, "Appearance saved.");
                  }}
                >
                  Save appearance
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="telegram-link">Telegram</Label>
                    <Input
                      id="telegram-link"
                      value={telegramLink}
                      onChange={(event) => setTelegramLink(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter-link">Twitter</Label>
                    <Input
                      id="twitter-link"
                      value={twitterLink}
                      onChange={(event) => setTwitterLink(event.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discord-link">Discord</Label>
                  <Input
                    id="discord-link"
                    value={discordLink}
                    onChange={(event) => setDiscordLink(event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  onClick={async () => {
                    await saveConfigPatch(
                      {
                        telegramLink: telegramLink || null,
                        twitterLink: twitterLink || null,
                        discordLink: discordLink || null,
                      },
                      "Social links saved.",
                    );
                  }}
                >
                  Save social links
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                  <div>
                    <p className="text-sm font-medium">Enable maintenance mode</p>
                    <p className="text-xs text-muted-foreground">
                      Non-admin dashboard routes are blocked while enabled.
                    </p>
                  </div>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={(checked) => setMaintenanceMode(checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance-message">Maintenance Message</Label>
                  <Textarea
                    id="maintenance-message"
                    rows={3}
                    value={maintenanceMessage}
                    onChange={(event) => setMaintenanceMessage(event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  onClick={async () => {
                    await saveConfigPatch(
                      {
                        maintenanceMode,
                        maintenanceMessage: maintenanceMessage || null,
                      },
                      "Maintenance settings saved.",
                    );
                  }}
                >
                  Save maintenance settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <Settings2 className="mr-2 h-4 w-4" />
                View dashboard ticker
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview landing page
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
