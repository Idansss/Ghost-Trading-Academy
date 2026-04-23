-- ============================================================
-- Repair migration for chat + notification objects that exist
-- in schema.prisma but were never fully captured in migrations.
-- Safe for repeat deploys via IF NOT EXISTS / duplicate guards.
-- ============================================================

-- 1. NotificationType enum values added after the original enum migration
DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEW_RECAP';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WIN_APPROVED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'STREAK_REMINDER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WEEKLY_REVIEW_READY';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LEADERBOARD_UPDATE';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BROADCAST';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DIRECT_MESSAGE';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "link" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
DO $$ BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Core chat tables
CREATE TABLE IF NOT EXISTS "ChatChannel" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "type" "ChannelType" NOT NULL DEFAULT 'GROUP',
  "isReadOnly" BOOLEAN NOT NULL DEFAULT false,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatChannel_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ChatChannel_slug_key" ON "ChatChannel"("slug");
DO $$ BEGIN
  ALTER TABLE "ChatChannel"
    ADD CONSTRAINT "ChatChannel_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ChannelMember" (
  "id" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "ChannelRole" NOT NULL DEFAULT 'MEMBER',
  "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isMuted" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "ChannelMember_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ChannelMember_userId_idx" ON "ChannelMember"("userId");
CREATE INDEX IF NOT EXISTS "ChannelMember_channelId_idx" ON "ChannelMember"("channelId");
CREATE UNIQUE INDEX IF NOT EXISTS "ChannelMember_channelId_userId_key" ON "ChannelMember"("channelId", "userId");
DO $$ BEGIN
  ALTER TABLE "ChannelMember"
    ADD CONSTRAINT "ChannelMember_channelId_fkey"
    FOREIGN KEY ("channelId") REFERENCES "ChatChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ChannelMember"
    ADD CONSTRAINT "ChannelMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT,
  "imageUrl" TEXT,
  "imageWidth" INTEGER,
  "imageHeight" INTEGER,
  "imageName" TEXT,
  "replyToId" TEXT,
  "isEdited" BOOLEAN NOT NULL DEFAULT false,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),
  "editedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ChatMessage_channelId_createdAt_idx" ON "ChatMessage"("channelId", "createdAt");
CREATE INDEX IF NOT EXISTS "ChatMessage_authorId_idx" ON "ChatMessage"("authorId");
DO $$ BEGIN
  ALTER TABLE "ChatMessage"
    ADD CONSTRAINT "ChatMessage_channelId_fkey"
    FOREIGN KEY ("channelId") REFERENCES "ChatChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ChatMessage"
    ADD CONSTRAINT "ChatMessage_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ChatMessage"
    ADD CONSTRAINT "ChatMessage_replyToId_fkey"
    FOREIGN KEY ("replyToId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "MessageReaction" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");
CREATE UNIQUE INDEX IF NOT EXISTS "MessageReaction_messageId_userId_emoji_key"
  ON "MessageReaction"("messageId", "userId", "emoji");
DO $$ BEGIN
  ALTER TABLE "MessageReaction"
    ADD CONSTRAINT "MessageReaction_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "MessageReaction"
    ADD CONSTRAINT "MessageReaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "PinnedMessage" (
  "id" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "pinnedById" TEXT NOT NULL,
  "pinnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PinnedMessage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PinnedMessage_messageId_key" ON "PinnedMessage"("messageId");
CREATE INDEX IF NOT EXISTS "PinnedMessage_channelId_idx" ON "PinnedMessage"("channelId");
DO $$ BEGIN
  ALTER TABLE "PinnedMessage"
    ADD CONSTRAINT "PinnedMessage_channelId_fkey"
    FOREIGN KEY ("channelId") REFERENCES "ChatChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "PinnedMessage"
    ADD CONSTRAINT "PinnedMessage_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Canonical default channels
INSERT INTO "ChatChannel" (
  "id",
  "name",
  "slug",
  "description",
  "type",
  "isReadOnly",
  "isArchived",
  "createdById",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    'chat_trading_room',
    'Trading Room',
    'trading-room',
    'Main desk chat. Admin drops live analysis and trade ideas here.',
    'GROUP',
    false,
    false,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'chat_chart_review',
    'Chart Review',
    'chart-review',
    'Post your chart analysis here for feedback. Image-heavy channel.',
    'GROUP',
    false,
    false,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'chat_signals_discussion',
    'Signals Discussion',
    'signals-discussion',
    'Discuss active signals. Auto-posts when a new signal goes live.',
    'GROUP',
    false,
    false,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'chat_wins_losses',
    'Wins & Losses',
    'wins-and-losses',
    'Share your trade results with chart screenshots.',
    'GROUP',
    false,
    false,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'chat_announcements',
    'Announcements',
    'announcements',
    'Admin-only posts. Members can react but not reply.',
    'ANNOUNCEMENT',
    true,
    false,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "type" = EXCLUDED."type",
  "isReadOnly" = EXCLUDED."isReadOnly",
  "isArchived" = EXCLUDED."isArchived",
  "updatedAt" = CURRENT_TIMESTAMP;

-- 5. Backfill all existing users into the non-DM default channels
INSERT INTO "ChannelMember" (
  "id",
  "channelId",
  "userId",
  "role",
  "lastReadAt",
  "joinedAt",
  "isMuted"
)
SELECT
  CONCAT('channel_member_', ch."id", '_', u."id"),
  ch."id",
  u."id",
  'MEMBER',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  false
FROM "ChatChannel" ch
CROSS JOIN "User" u
WHERE ch."type" IN ('GROUP', 'ANNOUNCEMENT')
  AND ch."isArchived" = false
ON CONFLICT ("channelId", "userId") DO NOTHING;
