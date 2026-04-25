"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  ImagePlus,
  List,
  ListOrdered,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import "@/styles/tiptap.css";
import { cn } from "@/lib/utils";
import { uploadFileToSupabaseStorage } from "@/lib/storage/upload-client";

type SaveState = "idle" | "saving" | "saved" | "error";
type UploadState = "idle" | "uploading";

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      data-active={active ? "true" : "false"}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-[color:var(--bg-elevated)] hover:text-foreground data-[active=true]:bg-[color:var(--color-gold-light)] data-[active=true]:text-[color:var(--color-gold)]",
      )}
    >
      {children}
    </button>
  );
}

export function RichNotesEditor({
  value,
  onSave,
}: {
  value?: string | null;
  onSave: (content: string) => Promise<void> | void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSavedContentRef = useRef(value ?? "");
  const [content, setContent] = useState(value ?? "");
  const [characterCount, setCharacterCount] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [uploadState, setUploadState] = useState<UploadState>("idle");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder:
          "Write your trade notes here — setup reasoning, emotions, mistakes, lessons...",
      }),
    ],
    content: value ?? "",
    editorProps: {
      attributes: {
        class:
          "ProseMirror min-h-[180px] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground",
      },
    },
    onCreate: ({ editor: tiptap }) => {
      const initialContent = tiptap.getHTML();
      setContent(initialContent);
      setCharacterCount(tiptap.getText().length);
      lastSavedContentRef.current = initialContent;
      setSaveState("saved");
    },
    onUpdate: ({ editor: tiptap }) => {
      const nextContent = tiptap.getHTML();
      setContent(nextContent);
      setCharacterCount(tiptap.getText().length);
      setIsDirty(nextContent !== lastSavedContentRef.current);
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextValue = value ?? "";

    if (nextValue !== editor.getHTML() && nextValue === lastSavedContentRef.current) {
      editor.commands.setContent(nextValue, false);
      setContent(nextValue);
      setCharacterCount(editor.getText().length);
      setIsDirty(false);
      setSaveState("saved");
    }
  }, [editor, value]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    setSaveState("saving");

    const timeout = window.setTimeout(async () => {
      try {
        await Promise.resolve(onSave(content));
        lastSavedContentRef.current = content;
        setIsDirty(false);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [content, isDirty, onSave]);

  const saveLabel = useMemo(() => {
    if (saveState === "saving") {
      return "Saving...";
    }

    if (saveState === "error") {
      return "Save failed";
    }

    return "Saved ✓";
  }, [saveState]);

  const handleInsertImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !editor) {
      return;
    }

    setUploadState("uploading");
    try {
      const publicUrl = await uploadFileToSupabaseStorage(file, "tradeNote");
      editor.chain().focus().setImage({ src: publicUrl }).run();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setUploadState("idle");
    }
  };

  return (
    <div className="tiptap-editor space-y-3">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[color:var(--bg-border)] bg-background/80 p-1 dark:bg-background/60">
        <ToolbarButton
          title="Bold"
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <span className="text-xs font-semibold">B</span>
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <span className="text-xs italic">I</span>
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor?.isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <span className="text-xs underline">U</span>
        </ToolbarButton>
        <ToolbarButton
          title="Bullet list"
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Align left"
          active={editor?.isActive({ textAlign: "left" })}
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Align center"
          active={editor?.isActive({ textAlign: "center" })}
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title={uploadState === "uploading" ? "Uploading..." : "Insert image"}
          onClick={() => uploadState === "idle" && inputRef.current?.click()}
        >
          {uploadState === "uploading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
        </ToolbarButton>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInsertImage}
        />
      </div>

      <div className="rounded-2xl border border-[color:var(--bg-border)] bg-card transition-colors focus-within:border-[color:var(--color-gold)]">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{characterCount} characters</span>
        <span
          className={cn(
            "transition-opacity duration-200",
            saveState === "saving" ? "opacity-100" : "opacity-80",
            saveState === "error" && "text-[color:var(--color-red)]",
            saveState === "saved" && "text-[color:var(--color-green)]",
          )}
        >
          {saveLabel}
        </span>
      </div>
    </div>
  );
}
