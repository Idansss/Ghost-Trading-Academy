"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { PageTransition } from "@/components/layout/PageTransition";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
          subscriptionStatus: string;
          subscriptionExpiry: string | null;
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
      currentPassword: "",
      newPassword: "",
    },
  });

  useEffect(() => {
    if (!data?.profile) return;
    form.reset({
      name: data.profile.name,
      avatarUrl: data.profile.avatarUrl ?? "",
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
    onSuccess: async () => {
      toast.success("Profile updated.");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await update();
    },
  });

  const initials =
    data?.profile.name
      ?.split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("") ?? "AV";

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
          description="Update your identity, review subscription access, and monitor lifetime stats."
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
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={data?.profile.avatarUrl ?? undefined} alt={data?.profile.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{data?.profile.name}</p>
                    <p className="text-sm text-muted-foreground">{data?.profile.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...form.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label>Avatar URL</Label>
                  <Input {...form.register("avatarUrl")} />
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
                label="Subscription"
                value={data?.profile.subscriptionStatus ?? "TRIAL"}
                helper={
                  data?.profile.subscriptionExpiry
                    ? `Expires ${new Date(data.profile.subscriptionExpiry).toLocaleDateString()}`
                    : "No expiry set"
                }
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Access Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Role: {data?.profile.role}</p>
                <p>Status: {data?.profile.subscriptionStatus}</p>
                <p>Email: {data?.profile.email}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
