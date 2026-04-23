"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/client-api";

type AdminChannel = {
  id: string;
  name: string;
  slug: string;
  type: "GROUP" | "DM" | "ANNOUNCEMENT";
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
    members: number;
  };
};

type SearchMessage = {
  id: string;
  channelId: string;
  channelName: string;
  body: string | null;
  imageUrl: string | null;
  deletedAt: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
};

export default function AdminChatPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [channelId, setChannelId] = useState("");

  const channelsQuery = useQuery({
    queryKey: ["admin", "chat", "channels"],
    queryFn: async () => {
      const response = await fetchJson<{ data: AdminChannel[] }>("/api/admin/chat/channels");
      return response.data;
    },
  });

  const searchQuery = useQuery({
    queryKey: ["admin", "chat", "search", search, channelId],
    enabled: Boolean(search.trim()),
    queryFn: async () => {
      const response = await fetchJson<{ data: { messages: SearchMessage[] } }>(
        `/api/admin/chat/search?q=${encodeURIComponent(search)}${channelId ? `&channelId=${channelId}` : ""}`,
      );
      return response.data.messages;
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) =>
      fetchJson(`/api/admin/chat/channels/${id}/archive`, { method: "PATCH" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "chat", "channels"] });
      toast.success("Channel archived");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => fetchJson(`/api/chat/messages/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "chat", "search"] });
      toast.success("Message deleted");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Chat Moderation"
        description="Review channels, archive rooms, and moderate chat messages."
      />

      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(channelsQuery.data ?? []).map((channel) => (
            <div key={channel.id} className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{channel.name}</p>
                  {/* AUDIT FIX: "secondary" is not a valid Badge variant; use "muted" for an archived/neutral state. */}
                  {channel.isArchived ? <Badge variant="muted">Archived</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {channel._count.messages} messages · {channel._count.members} members · Updated{" "}
                  {format(new Date(channel.updatedAt), "MMM d, p")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/community/chat?channel=${channel.id}`}>View</Link>
                </Button>
                {!channel.isArchived ? (
                  <Button size="sm" variant="outline" onClick={() => archiveMutation.mutate(channel.id)}>
                    Archive Channel
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search message text..." />
            <Input value={channelId} onChange={(event) => setChannelId(event.target.value)} placeholder="Optional channel id" />
          </div>
          <div className="space-y-2">
            {(searchQuery.data ?? []).map((message) => (
              <div key={message.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{message.author.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {message.channelName} · {format(new Date(message.createdAt), "MMM d, p")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(message.id)}
                  >
                    Delete
                  </Button>
                </div>
                <p className="mt-2 text-muted-foreground">
                  {message.deletedAt ? "Deleted message" : message.body ?? (message.imageUrl ? "[Image]" : "")}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
