"use client";

import { Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchJson } from "@/lib/client-api";
import { formatPercent } from "@/lib/utils";

type WinItem = {
  id: string;
  coin: string;
  pnlPercent: number;
  message: string;
  imageUrl: string | null;
  isApproved: boolean;
  likesCount: number;
  createdAt: Date | string;
  user: { name: string; avatarUrl: string | null };
};

export function WinsFeed({
  wins,
}: {
  wins: WinItem[];
}) {
  const router = useRouter();
  const [likeOverrides, setLikeOverrides] = useState<Record<string, number>>({});

  const likeMutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ likesCount: number }>(`/api/member-wins/${id}/like`, { method: "POST" }),
    onSuccess: (data, id) => {
      const n = (data as { likesCount?: number } | null | undefined)?.likesCount;
      if (typeof n === "number") {
        setLikeOverrides((prev) => ({ ...prev, [id]: n }));
      }
      router.refresh();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Could not like this win.";
      toast.error(msg);
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
        const likesCount = likeOverrides[win.id] ?? win.likesCount;

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
                    {!win.isApproved && (
                      <Badge variant="muted" className="text-xs">
                        Pending approval
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{win.message}</p>
                  {win.imageUrl ? (
                    <div className="relative mt-3 aspect-[2/1] w-full max-w-md overflow-hidden rounded-lg border border-border">
                      <Image
                        src={win.imageUrl}
                        alt={`${win.coin} chart`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 28rem"
                      />
                    </div>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(win.createdAt), { addSuffix: true })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      aria-label={`Like ${win.user.name}'s ${win.coin} win`}
                      disabled={
                        likeMutation.isPending && likeMutation.variables === win.id
                      }
                      onClick={() => likeMutation.mutate(win.id)}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      {likesCount}
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
