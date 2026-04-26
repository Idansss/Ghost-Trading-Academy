import sanitize from "sanitize-html";
import { AppError } from "@/server/core/app-error";
import { env } from "@/lib/env";

// CLAUDE FIX: renamed from isLegacyUploadthingUrl and dropped the configurable
// UPLOADTHING_CDN_DOMAIN env var (UploadThing is fully removed). The hardcoded
// host set remains so existing DB records pointing to the old CDN still display.
const legacyCdnHosts = new Set(["utfs.io", "uploadthing.com", "ufs.sh"]);

function isLegacyCdnUrl(url: URL): boolean {
  return legacyCdnHosts.has(url.hostname) || url.hostname.endsWith(".ufs.sh");
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
    return isLegacyCdnUrl(url) || isSupabasePublicObjectUrl(url);
  } catch {
    return false;
  }
}

/**
 * Strip all HTML — use for plain text fields (names, descriptions, short strings).
 * Replaces the old regex-based stripMarkup which could be bypassed by obfuscated tags.
 */
export function sanitizeText(value: string): string {
  return sanitize(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

/** @deprecated Use sanitizeText instead */
export function sanitizeHtml(value: string): string {
  return sanitizeText(value);
}

export function sanitizeRichText(value: string): string {
  return sanitize(value, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "blockquote", "code", "pre", "a", "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "class"],
      "*": ["class"],
    },
    allowedSchemes: ["https", "http"],
    disallowedTagsMode: "discard",
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
