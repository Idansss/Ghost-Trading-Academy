"use client";

import type { Resource } from "@prisma/client";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Circle, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchJson } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type ResourceWithCompletion = Resource & { completedByMe?: boolean };

export function ResourceCard({ resource, onCompletionChange }: {
  resource: ResourceWithCompletion;
  onCompletionChange?: (resourceId: string, completed: boolean) => void;
}) {
  const variant =
    resource.type === "PDF" ? "danger" : resource.type === "VIDEO" ? "info" : "default";

  const [completed, setCompleted] = useState(resource.completedByMe ?? false);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    setIsPending(true);
    const optimistic = !completed;
    setCompleted(optimistic);
    try {
      const res = await fetchJson<{ completed: boolean }>(`/api/education/${resource.id}/complete`, {
        method: "POST",
      });
      setCompleted(res.completed);
      onCompletionChange?.(resource.id, res.completed);
      toast.success(res.completed ? "Marked as complete." : "Marked as incomplete.");
    } catch {
      setCompleted(!optimistic);
      toast.error("Could not update completion status.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className={cn("transition-all hover:border-primary/40", completed && "border-[color:var(--color-green)]/30")}>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant={variant}>{resource.type}</Badge>
            <Badge variant="muted">{resource.tag}</Badge>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleToggle}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              completed
                ? "bg-[color:var(--color-green-light)] text-[color:var(--color-green)]"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {completed ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
            {completed
              ? resource.type === "VIDEO" ? "Watched" : "Read"
              : resource.type === "VIDEO" ? "Mark as watched" : "Mark as read"}
          </button>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">{resource.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {resource.description}
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          {resource.meta}
        </p>
        <Button asChild className="w-full">
          <Link href={resource.url} target="_blank">
            {resource.type === "PDF" ? (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download
              </>
            ) : (
              <>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Watch
              </>
            )}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
