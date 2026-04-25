"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChatErrorBoundary } from "@/components/chat/ChatErrorBoundary";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useChannels } from "@/hooks/useChat";
import type { ChatChannelWithMeta } from "@/types/chat";

export function ChatLayout({
  initialChannels,
  initialChannelId,
}: {
  initialChannels: ChatChannelWithMeta[];
  initialChannelId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const channelsQuery = useChannels();
  const channels = channelsQuery.data ?? initialChannels;

  // AUDIT FIX: Channel selection now stays in sync with the URL query param so
  // direct links, DM redirects, and refreshes all reopen the correct channel.
  const defaultChannelId = useMemo(
    () =>
      searchParams.get("channel") ??
      initialChannelId ??
      channels.find((channel) => channel.slug === "trading-room")?.id ??
      channels[0]?.id ??
      null,
    [channels, initialChannelId, searchParams],
  );
  const [activeChannelId, setActiveChannelId] = useState<string | null>(defaultChannelId);

  useEffect(() => {
    setActiveChannelId(defaultChannelId);
  }, [defaultChannelId]);

  const activeChannel = channels.find((channel) => channel.id === activeChannelId) ?? null;

  const handleSelectChannel = (selectedChannelId: string): void => {
    setActiveChannelId(selectedChannelId);
    router.replace(`/community/chat?channel=${selectedChannelId}`);
  };

  const handleBackToSidebar = (): void => {
    setActiveChannelId(null);
    router.replace("/community/chat");
  };

  return (
    <div className="surface-card relative flex h-full overflow-hidden p-0">
      {/* AUDIT FIX: Mobile navigation now uses transform-based panel swapping to
          avoid layout jumps when moving between the sidebar and chat window. */}
      <div
        className={`h-full w-full flex-none overflow-hidden border-r border-border md:block md:w-[320px] md:min-w-[320px] ${
          activeChannelId ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        } absolute inset-0 transition-transform duration-200 md:static`}
      >
        <ChatSidebar
          channels={channels}
          activeChannelId={activeChannelId}
          isAdmin={session?.user.role === "ADMIN"}
          onSelectChannel={handleSelectChannel}
        />
      </div>

      <div
        className={`absolute inset-0 min-w-0 flex-1 transition-transform duration-200 md:static ${
          activeChannelId ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        {activeChannel ? (
          <ChatErrorBoundary>
            <ChatWindow
              channel={activeChannel}
              channels={channels}
              onBackMobile={handleBackToSidebar}
            />
          </ChatErrorBoundary>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a channel to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
