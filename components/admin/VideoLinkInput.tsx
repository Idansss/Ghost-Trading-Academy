"use client";

import Image from "next/image";
import { useMemo } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";

const urlSchema = z.string().url().refine((value) => /^https?:\/\//.test(value), {
  message: "Enter a valid http/https URL.",
});

function extractYoutubeId(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1);
    }

    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }

  return null;
}

export function VideoLinkInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const validation = useMemo(() => urlSchema.safeParse(value), [value]);
  const youtubeId = useMemo(() => extractYoutubeId(value), [value]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <Input
          value={value}
          placeholder="https://youtube.com/watch?v=..."
          onChange={(event) => onChange(event.target.value)}
        />

        {youtubeId ? (
          <Image
            src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
            alt="YouTube thumbnail preview"
            width={112}
            height={64}
            className="h-16 w-28 rounded-xl object-cover"
          />
        ) : null}
      </div>

      {!validation.success && value ? (
        <p className="text-sm text-[color:var(--color-red)]">
          {validation.error.issues[0]?.message ?? "Enter a valid URL."}
        </p>
      ) : null}
    </div>
  );
}
