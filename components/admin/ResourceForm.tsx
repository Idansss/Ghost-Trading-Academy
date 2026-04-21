"use client";

import type { Resource, ResourceType } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { PdfUploadButton } from "@/components/admin/PdfUploadButton";
import { VideoLinkInput } from "@/components/admin/VideoLinkInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { resourceSchema } from "@/lib/validators";

type ResourceValues = z.input<typeof resourceSchema>;

const resourceTags = [
  "Foundation",
  "Strategy",
  "Psychology",
  "Risk",
  "Recap",
];

function getDefaultValues(initialValues?: Partial<ResourceValues> | null): ResourceValues {
  return {
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    type: initialValues?.type ?? "GUIDE",
    url: initialValues?.url ?? "",
    fileKey: initialValues?.fileKey ?? "",
    tag: initialValues?.tag ?? "Foundation",
    isVipOnly: initialValues?.isVipOnly ?? true,
    meta: initialValues?.meta ?? "",
  };
}

export function ResourceForm({
  initialValues,
  onSubmit,
  isSubmitting,
  submitLabel = "Save Resource",
}: {
  initialValues?: Partial<Resource> | null;
  onSubmit: (values: ResourceValues) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}) {
  const form = useForm<ResourceValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: getDefaultValues(initialValues),
  });

  useEffect(() => {
    form.reset(getDefaultValues(initialValues));
  }, [form, initialValues]);

  const isEditing = Boolean(initialValues);
  const type = form.watch("type");

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);

        if (!initialValues) {
          form.reset(getDefaultValues());
        }
      })}
    >
      <div className="space-y-2">
        <Label>Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {(["PDF", "VIDEO", "GUIDE"] as ResourceType[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => form.setValue("type", item, { shouldDirty: true })}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                type === item
                  ? "border-[color:var(--color-gold)] bg-[color:var(--color-gold-light)] text-[color:var(--color-gold)]"
                  : "border-border bg-transparent text-muted-foreground hover:bg-accent",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="resource-title">Title</Label>
          <Input id="resource-title" {...form.register("title")} />
        </div>

        <div className="space-y-2">
          <Label>Tag</Label>
          <Select
            value={form.watch("tag")}
            onValueChange={(value) => form.setValue("tag", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {resourceTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="resource-description">Description</Label>
          <Textarea
            id="resource-description"
            className="min-h-[120px]"
            {...form.register("description")}
          />
        </div>

        {type === "PDF" ? (
          <div className="space-y-2 md:col-span-2">
            <Label>{isEditing ? "Replace file" : "PDF Upload"}</Label>
            {isEditing && form.watch("meta") ? (
              <p className="text-sm text-muted-foreground">
                Current file: {form.watch("meta")}
              </p>
            ) : null}
            <PdfUploadButton
              value={
                form.watch("url") && form.watch("fileKey")
                  ? {
                      url: form.watch("url"),
                      key: form.watch("fileKey") ?? "",
                      name: form.watch("meta") || "Uploaded PDF",
                    }
                  : null
              }
              onUpload={(url, key, name) => {
                form.setValue("url", url, { shouldDirty: true, shouldValidate: true });
                form.setValue("fileKey", key, { shouldDirty: true });
                if (!form.getValues("meta")) {
                  form.setValue("meta", name, { shouldDirty: true });
                }
              }}
              onClear={() => {
                form.setValue("url", "", { shouldDirty: true });
                form.setValue("fileKey", "", { shouldDirty: true });
              }}
            />
          </div>
        ) : null}

        {type === "VIDEO" ? (
          <div className="space-y-2 md:col-span-2">
            <Label>Video URL</Label>
            <VideoLinkInput
              value={form.watch("url")}
              onChange={(value) =>
                form.setValue("url", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </div>
        ) : null}

        {type === "GUIDE" ? (
          <>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="resource-url">Guide URL</Label>
              <Input
                id="resource-url"
                placeholder="https://..."
                {...form.register("url")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Optional File Upload</Label>
              <PdfUploadButton
                value={
                  form.watch("url") && form.watch("fileKey")
                    ? {
                        url: form.watch("url"),
                        key: form.watch("fileKey") ?? "",
                        name: form.watch("meta") || "Uploaded guide",
                      }
                    : null
                }
                onUpload={(url, key, name) => {
                  form.setValue("url", url, { shouldDirty: true, shouldValidate: true });
                  form.setValue("fileKey", key, { shouldDirty: true });
                  if (!form.getValues("meta")) {
                    form.setValue("meta", name, { shouldDirty: true });
                  }
                }}
                onClear={() => {
                  form.setValue("fileKey", "", { shouldDirty: true });
                }}
              />
            </div>
          </>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="resource-meta">Meta</Label>
          <Input id="resource-meta" {...form.register("meta")} />
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium">VIP only</p>
            <p className="text-xs text-muted-foreground">
              Restrict access to VIP members
            </p>
          </div>
          <Switch
            checked={form.watch("isVipOnly")}
            onCheckedChange={(checked) =>
              form.setValue("isVipOnly", checked, { shouldDirty: true })
            }
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
