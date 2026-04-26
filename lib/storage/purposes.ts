import { z } from "zod";

export const signedUploadPurposeSchema = z.enum([
  "avatar",
  "tradeChart",
  "chatImage",
  "memberWin",
  "adminImage",
  "pdf",
  "tradeNote",
  "outlookResponse",
]);

export type SignedUploadPurpose = z.infer<typeof signedUploadPurposeSchema>;

const MB = 1024 * 1024;

export const uploadLimits: Record<
  SignedUploadPurpose,
  { maxBytes: number; allowedMimePrefixes: string[]; allowedMimeExact?: string[] }
> = {
  avatar: {
    maxBytes: 4 * MB,
    allowedMimePrefixes: ["image/"],
  },
  tradeChart: {
    maxBytes: 8 * MB,
    allowedMimeExact: ["image/jpeg", "image/png", "image/webp"],
    allowedMimePrefixes: [],
  },
  chatImage: {
    maxBytes: 8 * MB,
    allowedMimePrefixes: ["image/"],
  },
  memberWin: {
    maxBytes: 8 * MB,
    allowedMimePrefixes: ["image/"],
  },
  adminImage: {
    maxBytes: 8 * MB,
    allowedMimePrefixes: ["image/"],
  },
  tradeNote: {
    maxBytes: 4 * MB,
    allowedMimePrefixes: ["image/"],
  },
  outlookResponse: {
    maxBytes: 8 * MB,
    allowedMimePrefixes: ["image/"],
  },
  pdf: {
    maxBytes: 16 * MB,
    allowedMimeExact: ["application/pdf"],
    allowedMimePrefixes: [],
  },
};

export function folderForPurpose(purpose: SignedUploadPurpose, userId: string): string {
  const base = {
    avatar: "avatars",
    tradeChart: "trades",
    chatImage: "chat",
    memberWin: "wins",
    adminImage: "admin",
    pdf: "resources",
    tradeNote: "trade-notes",
    outlookResponse: "outlook-responses",
  }[purpose];
  return `${base}/${userId}`;
}
