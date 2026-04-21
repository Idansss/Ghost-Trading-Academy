import type { Announcement } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardContent } from "@/components/ui/card";

const typeClassMap: Record<Announcement["type"], string> = {
  SIGNAL_UPDATE: "border-[color:var(--color-gold)]",
  TP_HIT: "border-[color:var(--color-green)]",
  SL_HIT: "border-[color:var(--color-red)]",
  BREAKEVEN: "border-amber-500",
  INFO: "border-[color:var(--color-blue)]",
  WARNING: "border-amber-500",
  NEW_RESOURCE: "border-[color:var(--color-gold)]",
};

export function AnnouncementFeed({ announcements }: { announcements: Announcement[] }) {
  if (!announcements.length) {
    return (
      <EmptyState
        icon={<Bell />}
        title="No announcements yet"
        description="Admin announcements and trade updates will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card key={announcement.id} className={`border-l-4 ${typeClassMap[announcement.type]}`}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium">{announcement.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{announcement.message}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
