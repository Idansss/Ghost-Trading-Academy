import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { Prisma } from "@prisma/client";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { requireUser } from "@/lib/auth";
import { mapChannel } from "@/lib/chat";
import { prisma } from "@/lib/prisma";
import { optionalPrismaQuery } from "@/server/core/prisma-schema";

type ChatChannelWithRelations = Prisma.ChatChannelGetPayload<{
  include: {
    _count: { select: { members: true } };
    members: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            avatarUrl: true;
          };
        };
      };
    };
    messages: {
      orderBy: { createdAt: "desc" };
      take: 1;
      include: {
        author: {
          select: {
            name: true;
          };
        };
      };
    };
  };
}>;

export default async function CommunityChatPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const channels = await optionalPrismaQuery<ChatChannelWithRelations[]>(
    "community_chat_page_channels",
    () =>
      prisma.chatChannel.findMany({
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
      }),
    [],
  );

  // Compute unread counts in a single aggregation query instead of N+1.
  // Prisma.join() produces safe $1, $2, ... placeholders for the IN list.
  const channelIds = channels.map((ch) => ch.id);
  type UnreadRow = { channel_id: string; count: bigint };
  const unreadRows: UnreadRow[] = channelIds.length > 0
    ? await optionalPrismaQuery<UnreadRow[]>(
        "community_chat_page_unread_counts",
        () =>
          prisma.$queryRaw<UnreadRow[]>(
            Prisma.sql`
              SELECT cm."channelId" AS channel_id, COUNT(msg.id)::bigint AS count
              FROM "ChannelMember" cm
              LEFT JOIN "ChatMessage" msg
                ON msg."channelId" = cm."channelId"
                AND msg."authorId" != ${user.id}
                AND msg."createdAt" > cm."lastReadAt"
                AND msg."deletedAt" IS NULL
              WHERE cm."userId" = ${user.id}
                AND cm."channelId" IN (${Prisma.join(channelIds)})
              GROUP BY cm."channelId"
            `,
          ),
        [],
      )
    : [];

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
