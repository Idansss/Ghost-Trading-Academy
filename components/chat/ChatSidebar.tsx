"use client";

import { useMemo, useState } from "react";
import { Hash, Megaphone, MessageSquarePlus, Plus } from "lucide-react";
import { DMSearch } from "@/components/chat/DMSearch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateChannel } from "@/hooks/useChat";
import { cn } from "@/lib/utils";
import type { ChatChannelWithMeta } from "@/types/chat";

export function ChatSidebar({
  channels,
  activeChannelId,
  isAdmin,
  onSelectChannel,
}: {
  channels: ChatChannelWithMeta[];
  activeChannelId: string | null;
  isAdmin: boolean;
  onSelectChannel: (channelId: string) => void;
}) {
  const [openDmSearch, setOpenDmSearch] = useState(false);
  const [openChannelDialog, setOpenChannelDialog] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [channelType, setChannelType] = useState<"GROUP" | "ANNOUNCEMENT">("GROUP");
  const createChannelMutation = useCreateChannel();

  const announcementChannels = useMemo(
    () => channels.filter((channel) => channel.type === "ANNOUNCEMENT" && !channel.isArchived),
    [channels],
  );
  const groupChannels = useMemo(
    () => channels.filter((channel) => channel.type === "GROUP" && !channel.isArchived),
    [channels],
  );
  const directMessageChannels = useMemo(
    () => channels.filter((channel) => channel.type === "DM" && !channel.isArchived),
    [channels],
  );

  const renderChannelButton = (channel: ChatChannelWithMeta) => {
    const displayName = channel.type === "DM" ? channel.dmUser?.name ?? channel.name : channel.name;
    const initials = displayName
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    return (
      <li key={channel.id} role="listitem">
        <button
          type="button"
          onClick={() => onSelectChannel(channel.id)}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition",
            activeChannelId === channel.id
              ? "bg-primary/15 text-primary shadow-sm"
              : "hover:bg-muted/60",
          )}
        >
          {channel.type === "DM" ? (
            <Avatar className="h-9 w-9">
              <AvatarImage src={channel.dmUser?.image ?? undefined} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {channel.type === "ANNOUNCEMENT" ? <Megaphone className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className={cn("truncate text-sm", channel.unreadCount > 0 ? "font-medium" : "font-normal")}>
                {displayName}
              </p>
              {channel.unreadCount > 0 ? (
                <Badge className="rounded-full bg-red-500 px-2 py-0 text-[10px] text-white">
                  {channel.unreadCount}
                </Badge>
              ) : null}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {channel.lastMessage?.body ?? channel.description ?? "No messages yet"}
            </p>
          </div>
        </button>
      </li>
    );
  };

  return (
    <div className="flex h-full flex-col bg-card/60">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary">Ghost Trading Academy</p>
            <p className="text-xs text-muted-foreground">Community chat</p>
          </div>
          {isAdmin ? (
            <Dialog open={openChannelDialog} onOpenChange={setOpenChannelDialog}>
              <DialogTrigger asChild>
                <Button type="button" size="sm" variant="outline" aria-label="Create a new chat channel">
                  <Plus className="mr-2 h-4 w-4" />
                  New Channel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      value={channelName}
                      onChange={(event) => setChannelName(event.target.value)}
                      placeholder="Channel name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Textarea
                      value={channelDescription}
                      onChange={(event) => setChannelDescription(event.target.value)}
                      placeholder="Short description"
                      rows={3}
                      className="min-h-[96px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <select
                      aria-label="Channel type"
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                      value={channelType}
                      onChange={(event) => setChannelType(event.target.value as "GROUP" | "ANNOUNCEMENT")}
                    >
                      <option value="GROUP">Group</option>
                      <option value="ANNOUNCEMENT">Announcement</option>
                    </select>
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={createChannelMutation.isPending}
                    onClick={async () => {
                      const createdChannel = await createChannelMutation.mutateAsync({
                        name: channelName,
                        description: channelDescription || null,
                        type: channelType,
                        isReadOnly: channelType === "ANNOUNCEMENT",
                      });
                      setChannelName("");
                      setChannelDescription("");
                      setChannelType("GROUP");
                      setOpenChannelDialog(false);
                      onSelectChannel(createdChannel.id);
                    }}
                  >
                    Create channel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </div>

      {/* AUDIT FIX: The sidebar now owns its own scroll container so long channel
          lists stay usable without pushing the composer off-screen. */}
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <section className="space-y-2">
          <div className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Announcements
          </div>
          <ul role="list" className="space-y-1">
            {announcementChannels.map(renderChannelButton)}
          </ul>
        </section>

        <section className="space-y-2">
          <div className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Group Channels
          </div>
          <ul role="list" className="space-y-1">
            {groupChannels.map(renderChannelButton)}
          </ul>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Direct Messages
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setOpenDmSearch(true)}
              aria-label="Open direct message search"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
          </div>
          <ul role="list" className="space-y-1">
            {directMessageChannels.map(renderChannelButton)}
          </ul>
        </section>
      </div>

      <div className="border-t border-border p-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setOpenDmSearch(true)}
          aria-label="Start a new direct message"
        >
          <Plus className="mr-2 h-4 w-4" />
          New DM
        </Button>
      </div>

      <DMSearch open={openDmSearch} onOpenChange={setOpenDmSearch} />
    </div>
  );
}
