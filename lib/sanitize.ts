import { AppError } from "@/server/core/app-error";

const trustedImageHosts = new Set([
  "utfs.io",
  "uploadthing.com",
]);

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
  // Server routes render these fields back as plain text, not injected HTML.
  // Keep a lightweight text sanitizer here to avoid DOM-based server deps.
  return stripMarkup(value);
}

export function assertTrustedImageUrl(url: string | null | undefined) {
  if (!url) return;
  const parsed = new URL(url);
  if (!trustedImageHosts.has(parsed.hostname)) {
    // AUDIT FIX: Replaced generic Error with AppError.badRequest() so the
    // createRouteHandler error boundary maps it to 400 instead of 500.
    throw AppError.badRequest("Image URL must come from a trusted CDN.", [
      { field: "chartImageUrl", message: "Image must be hosted on UploadThing." },
    ]);
  }
}
