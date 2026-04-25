"use client";

import { createClient } from "@supabase/supabase-js";
import type { SignedUploadPurpose } from "@/lib/storage/purposes";

type SignResponse = {
  bucket: string;
  path: string;
  token: string;
  publicUrl: string;
};

/** Path within the storage bucket, e.g. `chat/userId/abc.png`. */
export function objectPathFromSupabasePublicUrl(publicUrl: string): string {
  const u = new URL(publicUrl);
  const parts = u.pathname.split("/").filter(Boolean);
  const publicIdx = parts.indexOf("public");
  if (publicIdx === -1 || parts.length < publicIdx + 3) {
    throw new Error("Invalid Supabase storage public URL.");
  }
  return parts
    .slice(publicIdx + 2)
    .map((segment) => decodeURIComponent(segment))
    .join("/");
}

/**
 * Request a signed upload from our API, then complete it with the Supabase
 * client (anon key). Files never pass through our Vercel function body, so
 * large PDFs work within Supabase limits.
 */
export async function uploadFileToSupabaseStorage(
  file: File,
  purpose: SignedUploadPurpose,
  options?: {
    onProgress?: (percent: number) => void;
  },
): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Storage is not configured (missing Supabase environment variables).");
  }

  options?.onProgress?.(5);

  const signResponse = await fetch("/api/storage/signed-upload", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      purpose,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      fileSize: file.size,
    }),
  });

  const payload = (await signResponse.json().catch(() => ({}))) as {
    error?: string | { code?: string; message?: string };
    details?: unknown;
    bucket?: string;
    path?: string;
    token?: string;
    publicUrl?: string;
  };

  if (!signResponse.ok) {
    const fromPayload = (() => {
      const e = payload.error;
      if (typeof e === "string") return e;
      if (e && typeof e === "object" && "message" in e && typeof e.message === "string") {
        return e.message;
      }
      return null;
    })();

    if (signResponse.status === 401) {
      throw new Error("Sign in required to upload images.");
    }
    if (signResponse.status === 403) {
      throw new Error(fromPayload ?? "You do not have permission to upload this file type.");
    }
    if (signResponse.status === 503) {
      throw new Error(
        fromPayload ?? "Storage is not configured. Check Supabase environment variables on the server.",
      );
    }
    throw new Error(fromPayload ?? "Could not start upload.");
  }

  const { bucket, path, token, publicUrl } = payload as SignResponse;

  if (!bucket || !path || !token || !publicUrl) {
    throw new Error("Invalid response from upload service.");
  }

  options?.onProgress?.(30);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {
    contentType: file.type || "application/octet-stream",
  });

  if (error) {
    throw new Error(error.message || "Upload failed.");
  }

  options?.onProgress?.(100);
  return publicUrl;
}
