import { AppError } from "@/server/core/app-error";
import { env } from "@/lib/env";

const legacyUploadthingHosts = new Set(["utfs.io", "uploadthing.com", "ufs.sh"]);

function isLegacyUploadthingUrl(url: URL): boolean {
  const configured = env.uploadthingCdnDomain?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (
    configured &&
    (url.hostname === configured || url.hostname.endsWith(`.${configured}`))
  ) {
    return true;
  }
  return legacyUploadthingHosts.has(url.hostname) || url.hostname.endsWith(".ufs.sh");
}

function isSupabasePublicObjectUrl(url: URL): boolean {
  const base = env.nextPublicSupabaseUrl;
  if (!base) {
    return false;
  }
  let expectedHost: string;
  try {
    expectedHost = new URL(base).hostname;
  } catch {
    return false;
  }
  if (url.hostname !== expectedHost) {
    return false;
  }
  const bucket = env.supabaseStorageBucket;
  const prefix = `/storage/v1/object/public/${bucket}/`;
  return url.pathname.startsWith(prefix);
}

export function isTrustedMediaUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return isLegacyUploadthingUrl(url) || isSupabasePublicObjectUrl(url);
  } catch {
    return false;
  }
}

function stripMarkup(value: string) {
  return value
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*(p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<\s*li\b[^>]*>/gi, "- ")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizeHtml(value: string) {
  return stripMarkup(value);
}

export function assertTrustedImageUrl(
  url: string | null | undefined,
  field = "chartImageUrl",
) {
  if (!url) return;
  if (!isTrustedMediaUrl(url)) {
    throw AppError.badRequest("Image URL must come from trusted storage.", [
      { field, message: "Image must be hosted on an allowed CDN." },
    ]);
  }
}
