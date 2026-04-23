import DOMPurify from "isomorphic-dompurify";
import { AppError } from "@/server/core/app-error";

const trustedImageHosts = new Set([
  "utfs.io",
  "uploadthing.com",
]);

export function sanitizeHtml(value: string) {
  return DOMPurify.sanitize(value, {
    USE_PROFILES: { html: true },
  });
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
