"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RichNotesEditor } from "@/components/journal/RichNotesEditor";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchJson } from "@/lib/client-api";

type BroadcastHistoryItem = {
  id: string;
  subject: string;
  recipientCount: number;
  sentVia: Array<"EMAIL" | "IN_APP" | "PUSH">;
  sentAt: string;
  openRate: number;
};

export default function AdminBroadcastPage() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("<p></p>");
  const [targetType, setTargetType] = useState<"ALL_MEMBERS" | "BY_ROLE" | "JOINED_LAST_30_DAYS" | "NO_TRADE_14_DAYS">("ALL_MEMBERS");
  const [role, setRole] = useState<"MEMBER" | "VIP" | "ADMIN">("MEMBER");
  const [channels, setChannels] = useState<Array<"EMAIL" | "IN_APP" | "PUSH">>(["IN_APP"]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);

  const historyQuery = useQuery({
    queryKey: ["broadcast-history"],
    queryFn: () => fetchJson<{ broadcasts: BroadcastHistoryItem[] }>("/api/admin/broadcast"),
  });

  const payload = useMemo(
    () => ({
      subject,
      body,
      targeting: targetType === "BY_ROLE" ? { type: targetType, role } : { type: targetType },
      channels,
    }),
    [body, channels, role, subject, targetType],
  );

  const sendMutation = useMutation({
    mutationFn: (extra?: { sendTest?: boolean; dryRun?: boolean }) =>
      fetchJson<{ recipientCount?: number }>("/api/admin/broadcast", {
        method: "POST",
        body: JSON.stringify({ ...payload, ...extra }),
      }),
    onSuccess: async (_data, vars) => {
      if (!vars?.dryRun) {
        toast.success(vars?.sendTest ? "Test broadcast sent." : "Broadcast sent.");
        await queryClient.invalidateQueries({ queryKey: ["broadcast-history"] });
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin"
          title="Broadcast Center"
          description="Compose rich broadcasts, target recipients, and send across in-app, email, and push."
        />

        <Card>
          <CardHeader>
            <CardTitle>Compose Broadcast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Broadcast subject" />
            </div>
            <div className="space-y-2">
              <Label>Message Body</Label>
              <RichNotesEditor value={body} onSave={async (content) => setBody(content)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Recipient Targeting</Label>
                <select
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  value={targetType}
                  onChange={(event) => setTargetType(event.target.value as typeof targetType)}
                >
                  <option value="ALL_MEMBERS">All Members</option>
                  <option value="BY_ROLE">By Role</option>
                  <option value="JOINED_LAST_30_DAYS">Joined in Last 30 Days</option>
                  <option value="NO_TRADE_14_DAYS">No Trade in Last 14 Days</option>
                </select>
                {targetType === "BY_ROLE" ? (
                  <select
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    value={role}
                    onChange={(event) => setRole(event.target.value as typeof role)}
                  >
                    <option value="MEMBER">MEMBER</option>
                    <option value="VIP">VIP</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Channels</Label>
                <div className="space-y-2 rounded-xl border border-border p-3 text-sm">
                  {(["IN_APP", "EMAIL", "PUSH"] as const).map((channel) => (
                    <label key={channel} className="flex items-center gap-2">
                      <Checkbox
                        checked={channels.includes(channel)}
                        onCheckedChange={(checked) => {
                          setChannels((prev) =>
                            checked
                              ? Array.from(new Set([...prev, channel]))
                              : prev.filter((entry) => entry !== channel),
                          );
                        }}
                      />
                      {channel}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  await sendMutation.mutateAsync({ sendTest: true });
                }}
              >
                Send Test to Myself
              </Button>
              <Button
                onClick={async () => {
                  const preview = await sendMutation.mutateAsync({ dryRun: true });
                  setRecipientCount(preview.recipientCount ?? 0);
                  setConfirmOpen(true);
                }}
              >
                Send Broadcast
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sent History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(historyQuery.data?.broadcasts ?? []).map((item) => (
              <div key={item.id} className="rounded-xl border border-border p-3 text-sm">
                <p className="font-medium">{item.subject}</p>
                <p className="text-muted-foreground">
                  Recipients: {item.recipientCount} | Channels: {item.sentVia.join(", ")} | Open rate: {item.openRate.toFixed(1)}%
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Broadcast Send</DialogTitle>
            <DialogDescription>
              This message will be sent to {recipientCount} recipients.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await sendMutation.mutateAsync({});
                setConfirmOpen(false);
              }}
            >
              Confirm Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
