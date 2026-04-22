"use client";

import { Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchJson } from "@/lib/client-api";
import { formatPercent } from "@/lib/utils";

export function WinsFeed({
  wins,
}: {
  wins: Array<{
    id: string;
    coin: string;
    pnlPercent: number;
    message: string;
    likesCount: number;
    createdAt: Date | string;
    user: { name: string; avatarUrl: string | null };
  }>;
}) {
  const router = useRouter();
  const likeMutation = useMutation({
    mutationFn: (id: string) => fetchJson(`/api/member-wins/${id}/like`, { method: "POST" }),
    onSuccess: async () => {
      router.refresh();
    },
  });

  return (
    <div className="space-y-4">
      {wins.map((win) => {
        const initials = win.user.name
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0])
          .join("");

        return (
          <Card key={win.id}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={win.user.avatarUrl ?? undefined} alt={win.user.name} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{win.user.name}</p>
                    <Badge variant="success">{win.coin}</Badge>
                    <Badge variant="success">{formatPercent(win.pnlPercent)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{win.message}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(win.createdAt), { addSuffix: true })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Like ${win.user.name}'s ${win.coin} win`}
                      onClick={() => likeMutation.mutate(win.id)}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      {win.likesCount}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
