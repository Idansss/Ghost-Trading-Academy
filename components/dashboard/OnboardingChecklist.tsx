"use client";

import Link from "next/link";
import { BookOpen, CheckCircle2, Circle, Trophy, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChecklistItem = {
  id: string;
  label: string;
  href: string;
  done: boolean;
  icon: React.ReactNode;
};

export function OnboardingChecklist({
  hasTrades,
  hasSignalsTaken,
  hasCompletedResources,
  hasWins,
}: {
  hasTrades: boolean;
  hasSignalsTaken: boolean;
  hasCompletedResources: boolean;
  hasWins: boolean;
}) {
  const allDone = hasTrades && hasSignalsTaken && hasCompletedResources && hasWins;

  if (allDone) return null;

  const items: ChecklistItem[] = [
    {
      id: "trade",
      label: "Log your first trade",
      href: "/journal",
      done: hasTrades,
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      id: "signal",
      label: "Check out today's signals",
      href: "/signals",
      done: hasSignalsTaken,
      icon: <Zap className="h-4 w-4" />,
    },
    {
      id: "education",
      label: "Read an education resource",
      href: "/education",
      done: hasCompletedResources,
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      id: "win",
      label: "Submit your first win",
      href: "/community",
      done: hasWins,
      icon: <Trophy className="h-4 w-4" />,
    },
  ];

  const completedCount = items.filter((i) => i.done).length;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Getting Started</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount}/{items.length} complete
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              item.done
                ? "text-muted-foreground line-through"
                : "hover:bg-accent hover:text-foreground"
            }`}
          >
            {item.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--color-green)]" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            {item.label}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
