import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Do NOT import @/lib/env here — this module is imported by client components
// (AvatarUploadButton, TradeChartUploadField). Server-only env vars would be
// bundled into the browser and throw a ZodError at runtime.
export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();

/** Shape returned by `startUpload` / `uploadFiles` (UploadThing v7+). */
export type UploadThingClientFile = {
  url?: string;
  key?: string;
  name?: string;
  serverData?: {
    url?: string;
    key?: string;
    name?: string;
    userId?: string;
  } | null;
};

// UploadThing v7 does not populate `serverData` unless the route sets
// `awaitServerData: true`. The CDN URL and metadata are always on the root
// object, so read both shapes for compatibility.
export function getUploadThingFileUrl(
  file: UploadThingClientFile | undefined,
): string | undefined {
  return file?.url ?? file?.serverData?.url ?? undefined;
}

export function getUploadThingFilePayload(
  file: UploadThingClientFile | undefined,
): { url: string; key: string; name: string } | null {
  const url = getUploadThingFileUrl(file);
  if (!url) {
    return null;
  }
  return {
    url,
    key: file?.key ?? file?.serverData?.key ?? "",
    name: file?.name ?? file?.serverData?.name ?? "",
  };
}
