"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { resourceSchema } from "@/lib/validators";

type ResourceValues = z.input<typeof resourceSchema>;

export function UploadResourceForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: ResourceValues) => Promise<void>;
  isSubmitting?: boolean;
}) {
  const form = useForm<ResourceValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "GUIDE",
      url: "",
      fileKey: "",
      tag: "Foundation",
      isPremiumOnly: true,
      meta: "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Resource</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
            form.reset();
          })}
        >
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value as ResourceValues["type"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["PDF", "VIDEO", "GUIDE"].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>URL</Label>
            <Input {...form.register("url")} />
          </div>
          <div className="space-y-2">
            <Label>Tag</Label>
            <Input {...form.register("tag")} />
          </div>
          <div className="space-y-2">
            <Label>Meta</Label>
            <Input {...form.register("meta")} />
          </div>
          <div className="space-y-2">
            <Label>File Key</Label>
            <Input {...form.register("fileKey")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} />
          </div>
          <div className="md:col-span-2">
            <Button disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Resource"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
