import type { Resource } from "@prisma/client";
import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ResourceCard({ resource }: { resource: Resource }) {
  const variant =
    resource.type === "PDF" ? "danger" : resource.type === "VIDEO" ? "info" : "default";

  return (
    <Card className="transition-all hover:border-primary/40">
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant={variant}>{resource.type}</Badge>
          <Badge variant="muted">{resource.tag}</Badge>
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
