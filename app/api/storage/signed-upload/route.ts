import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  folderForPurpose,
  signedUploadPurposeSchema,
  uploadLimits,
  type SignedUploadPurpose,
} from "@/lib/storage/purposes";
import { getSupabaseServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  purpose: signedUploadPurposeSchema,
  fileName: z.string().min(1).max(220),
  contentType: z.string().min(1).max(120),
  fileSize: z.coerce.number().int().positive().max(32 * 1024 * 1024).optional(),
});

function safeSegment(name: string): string {
  const stripped = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "");
  return (stripped || "file").slice(0, 96);
}

function validateMime(purpose: SignedUploadPurpose, contentType: string): boolean {
  const cfg = uploadLimits[purpose];
  if (cfg.allowedMimeExact?.length) {
    return cfg.allowedMimeExact.includes(contentType);
  }
  return cfg.allowedMimePrefixes.some((p) => contentType.startsWith(p));
}

export async function POST(request: Request) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and optionally SUPABASE_STORAGE_BUCKET.",
      },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { purpose, fileName, contentType, fileSize } = parsed.data;

  if ((purpose === "pdf" || purpose === "adminImage") && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!validateMime(purpose, contentType)) {
    return NextResponse.json({ error: "File type not allowed for this upload." }, { status: 400 });
  }

  const maxBytes = uploadLimits[purpose].maxBytes;
  if (fileSize !== undefined && fileSize > maxBytes) {
    return NextResponse.json(
      { error: `File is too large (max ${Math.round(maxBytes / (1024 * 1024))}MB for this upload).` },
      { status: 400 },
    );
  }

  const bucket = env.supabaseStorageBucket;
  const folder = folderForPurpose(purpose, session.user.id);
  const path = `${folder}/${nanoid(14)}-${safeSegment(fileName)}`;

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create signed upload URL." },
      { status: 500 },
    );
  }

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return NextResponse.json({
    bucket,
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: pub.publicUrl,
    maxBytes,
  });
}
