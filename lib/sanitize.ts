import DOMPurify from "isomorphic-dompurify";
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

/**
 * Strip all HTML — use for plain text fields (names, descriptions, short strings).
 * Replaces the old regex-based stripMarkup which could be bypassed by obfuscated tags.
 */
export function sanitizeText(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

/** @deprecated Use sanitizeText instead */
export function sanitizeHtml(value: string): string {
  return sanitizeText(value);
}

/**
 * Allow a safe subset of HTML tags — use for rich text fields (TipTap output, markdown-rendered content).
 * Blocks scripts, event handlers, javascript: hrefs, and data: src attributes.
 */
export function sanitizeRichText(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "blockquote", "code", "pre", "a", "img",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "class"],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ["style", "onclick", "onerror", "onload"],
  }).trim();
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
