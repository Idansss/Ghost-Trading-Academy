import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { requireUser } from "@/lib/auth";
import { mapChannel } from "@/lib/chat";
import { prisma } from "@/lib/prisma";

export default async function CommunityChatPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const channels = await prisma.chatChannel.findMany({
    where: {
      isArchived: false,
      OR: [
        {
          type: { in: ["GROUP", "ANNOUNCEMENT"] },
          members: { some: { userId: user.id } },
        },
        {
          type: "DM",
          members: { some: { userId: user.id } },
        },
      ],
    },
    include: {
      _count: { select: { members: true } },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          author: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // AUDIT FIX: Previously fired one prisma.chatMessage.count() per channel in
  // Promise.all (N+1). Replaced with a single raw SQL aggregation so unread
  // counts are computed in one round-trip regardless of channel count.
  const channelIds = channels.map((ch) => ch.id);
  type UnreadRow = { channel_id: string; count: bigint };
  const unreadRows = channelIds.length > 0
    ? await prisma.$queryRaw<UnreadRow[]>`
        SELECT cm."channelId" AS channel_id, COUNT(msg.id)::bigint AS count
        FROM "ChannelMember" cm
        LEFT JOIN "ChatMessage" msg
          ON msg."channelId" = cm."channelId"
          AND msg."authorId" != ${user.id}
          AND msg."createdAt" > cm."lastReadAt"
          AND msg."deletedAt" IS NULL
        WHERE cm."userId" = ${user.id}
          AND cm."channelId" = ANY(${channelIds}::text[])
        GROUP BY cm."channelId"
      `
    : ([] as UnreadRow[]);

  const unreadMap = new Map<string, number>(
    unreadRows.map(({ channel_id, count }) => [channel_id, Number(count)]),
  );

  const initialChannels = channels.map((channel) =>
    mapChannel(channel, user.id, unreadMap.get(channel.id) ?? 0),
  );

  const sortedChannels = initialChannels.sort((left, right) => {
    const getPriority = (type: string): number => {
      if (type === "ANNOUNCEMENT") return 0;
      if (type === "GROUP") return 1;
      return 2;
    };

    const typeOrder = getPriority(left.type) - getPriority(right.type);
    if (typeOrder !== 0) {
      return typeOrder;
    }

    return (
      new Date(right.lastMessage?.createdAt ?? right.updatedAt).getTime() -
      new Date(left.lastMessage?.createdAt ?? left.updatedAt).getTime()
    );
  });

  const queryClient = new QueryClient();
  queryClient.setQueryData(["chat", "channels"], sortedChannels);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Community" title="Community Chat" description="Live desk chat, DMs, and announcements." />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ChatLayout initialChannels={sortedChannels} initialChannelId={params.channel ?? null} />
      </HydrationBoundary>
    </div>
  );
}
