"use client";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useTheme } from "next-themes";

interface EmojiPickerWrapperProps {
  onEmojiSelect: (emoji: { native: string }) => void;
}

export default function EmojiPickerWrapper({ onEmojiSelect }: EmojiPickerWrapperProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Picker
      data={data}
      onEmojiSelect={onEmojiSelect}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      previewPosition="none"
      skinTonePosition="search"
      maxFrequentRows={1}
    />
  );
}
