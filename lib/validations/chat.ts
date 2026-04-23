import { ChannelType } from "@prisma/client";
import { z } from "zod";
import { CHAT_ALLOWED_EMOJIS } from "@/types/chat";

// AUDIT FIX: Chat validation schemas were incomplete and the reaction allowlist
// had mojibake-encoded emoji values. This file now defines the exact request
// contracts used by the production chat routes.
// AUDIT FIX: Previously used z.nativeEnum(ChannelType) which allowed an admin
// to accidentally POST a DM channel via this route, causing createMany to add
// every user in the platform as a "DM" member. Restricted to GROUP and
// ANNOUNCEMENT — the only types that should be admin-created.
export const createChannelSchema = z.object({
  name: z.string().trim().min(3).max(50),
  description: z.string().trim().max(280).optional().nullable(),
  type: z.enum([ChannelType.GROUP, ChannelType.ANNOUNCEMENT]),
  isReadOnly: z.boolean().optional().default(false),
});

export const sendMessageSchema = z
  .object({
    body: z.string().trim().max(2000).optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    imageWidth: z.number().int().positive().optional().nullable(),
    imageHeight: z.number().int().positive().optional().nullable(),
    imageName: z.string().max(255).optional().nullable(),
    replyToId: z.string().cuid().optional().nullable(),
  })
  .refine((value) => Boolean(value.body?.trim() || value.imageUrl), {
    message: "Either message body or imageUrl is required.",
    path: ["body"],
  });

export const editMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export const reactionSchema = z.object({
  emoji: z.enum(CHAT_ALLOWED_EMOJIS),
});

export const typingSchema = z.object({
  channelId: z.string().cuid(),
  isTyping: z.boolean(),
});
