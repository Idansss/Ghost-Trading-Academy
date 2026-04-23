import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Do NOT import @/lib/env here — this module is imported by client components
// (AvatarUploadButton, TradeChartUploadField). Server-only env vars would be
// bundled into the browser and throw a ZodError at runtime.
export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();
