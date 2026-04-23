"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/client-api";

type EngagementData = {
  dauChart: Array<{ date: string; users: number }>;
  topActiveMembers: Array<{ id: string; name: string; tradeCount: number }>;
  topViewedSignals: Array<{ id: string; coin: string; views: number }>;
  mostCompletedResources: Array<{ id: string; title: string; completions: number }>;
  funnel: {
    registered: number;
    onboardingCompleted: number;
    firstTrade: number;
    firstSignalTaken: number;
    firstResourceCompleted: number;
  };
  atRiskMembers: Array<{ id: string; name: string; email: string; lastActivity: string }>;
};

export default function AdminEngagementPage() {
  const query = useQuery({
    queryKey: ["admin-engagement"],
    queryFn: () => fetchJson<EngagementData>("/api/admin/engagement"),
  });

  const data = query.data;

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin"
          title="Engagement Dashboard"
          description="Track member activity, learning completion, and churn risk across the platform."
        />

        <Card>
          <CardHeader>
            <CardTitle>Daily Active Users (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.dauChart ?? []}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="users" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Top Active Members</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(data?.topActiveMembers ?? []).map((member) => (
                <p key={member.id} className="text-sm">{member.name} - {member.tradeCount} trades</p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Top Viewed Signals</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(data?.topViewedSignals ?? []).map((signal) => (
                <p key={signal.id} className="text-sm">{signal.coin} - {signal.views} views</p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Most Completed Resources</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(data?.mostCompletedResources ?? []).map((resource) => (
                <p key={resource.id} className="text-sm">{resource.title} - {resource.completions} completions</p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Funnel</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Registered: {data?.funnel.registered ?? 0}</p>
              <p>Onboarding Completed: {data?.funnel.onboardingCompleted ?? 0}</p>
              <p>First Trade: {data?.funnel.firstTrade ?? 0}</p>
              <p>First Signal Taken: {data?.funnel.firstSignalTaken ?? 0}</p>
              <p>First Resource Completed: {data?.funnel.firstResourceCompleted ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Members at Risk of Churning</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.atRiskMembers ?? []).map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-muted-foreground">{member.email}</p>
                </div>
                <Button size="sm" variant="outline">Send Re-engagement Email</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
