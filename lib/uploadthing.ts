import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { env } from "@/lib/env";

void env.uploadthingAppId;

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();
