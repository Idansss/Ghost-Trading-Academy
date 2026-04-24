"use client";

import { useState } from "react";
import { WinsFeed } from "@/components/community/WinsFeed";
import { ShareWinModal } from "@/components/community/ShareWinModal";

type Win = {
  id: string;
  userId: string;
  coin: string;
  pnlPercent: number;
  message: string;
  imageUrl: string | null;
  likesCount: number;
  isApproved: boolean;
  createdAt: Date | string;
  user: { name: string; avatarUrl: string | null };
};

export function WinsFeedClient({
  initialWins,
  userName,
  userAvatarUrl,
}: {
  initialWins: Win[];
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
}) {
  const [wins, setWins] = useState(initialWins);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Member Wins</h2>
          <p className="text-xs text-muted-foreground">Approved wins from the desk</p>
        </div>
        <ShareWinModal
          userName={userName}
          userAvatarUrl={userAvatarUrl}
          onWinShared={(win) => {
            setWins((prev) => [
              {
                ...win,
                imageUrl: win.imageUrl ?? null,
                createdAt: new Date(win.createdAt),
              },
              ...prev,
            ]);
          }}
        />
      </div>
      <WinsFeed wins={wins} />
    </div>
  );
}
