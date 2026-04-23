import { differenceInCalendarDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type HeatmapCell = {
  date: string;
  label: string;
  hasActivity: boolean;
  count: number;
  isToday: boolean;
};

type StreakCardProps = {
  current: number;
  longest: number;
  disciplineScore: number;
  lastJournalDate: string | null;
  heatmap: HeatmapCell[];
};

function FlameIcon() {
  return (
    <div className="relative h-11 w-9" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 mx-auto h-9 w-7 rounded-[60%_60%_48%_48%] bg-primary rotate-45" />
      <div className="absolute left-3 top-1 h-5 w-5 rounded-[60%_60%_40%_40%] bg-[color:var(--color-gold)] rotate-45" />
      <div className="absolute left-[0.65rem] top-3 h-3.5 w-3.5 rounded-[60%_60%_40%_40%] bg-background/80 rotate-45" />
    </div>
  );
}

export function StreakCard({
  current,
  longest,
  disciplineScore,
  lastJournalDate,
  heatmap,
}: StreakCardProps) {
  const clampedScore = Math.max(0, Math.min(100, disciplineScore));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clampedScore / 100) * circumference;
  const daysSinceJournal =
    lastJournalDate === null
      ? null
      : differenceInCalendarDays(new Date(), new Date(lastJournalDate));
  const streakCopy =
    current > 0
      ? daysSinceJournal === 0
        ? "You protected the streak today."
        : daysSinceJournal === 1
          ? "Log today to keep the streak alive."
          : "The streak is active, but today still needs a journal entry."
      : "Your first logged trade starts the streak.";

  return (
    <Card className="premium-ring">
      <CardHeader className="space-y-1">
        <CardTitle>Streak & Accountability</CardTitle>
        <p className="text-sm text-muted-foreground">
          Keep the journal habit alive and measure weekly discipline, not just outcomes.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current streak — full width, prominent */}
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-background/90 shadow-sm">
              <FlameIcon />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Current Streak
              </p>
              <p className="mt-1.5 text-4xl font-semibold" data-number="true">{current}</p>
              <p className="mt-1 text-sm text-muted-foreground">{streakCopy}</p>
            </div>
          </div>
        </div>

        {/* Longest run — secondary stat */}
        <div className="rounded-2xl border border-border bg-card/60 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Longest Run
          </p>
          <p className="mt-2 text-3xl font-semibold" data-number="true">{longest}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Best journaling streak you have held so far.
          </p>
        </div>

        {/* Weekly discipline score */}
        <div className="rounded-2xl border border-border p-5">
          <div className="flex items-center gap-5">
            <div className="relative h-24 w-24 shrink-0">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-border" />
                <circle
                  cx="60" cy="60" r={radius} fill="none" stroke="currentColor"
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={dashOffset}
                  className={cn(
                    clampedScore >= 80 ? "text-[color:var(--color-green)]"
                      : clampedScore >= 60 ? "text-primary"
                      : "text-[color:var(--color-red)]",
                  )}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-2xl font-semibold" data-number="true">{clampedScore.toFixed(0)}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</p>
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Weekly Discipline
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Score based on journaling, signal reviews, education progress, and daily planning.
              </p>
            </div>
          </div>
        </div>

        {/* 7-day heatmap */}
        <div className="rounded-2xl border border-border p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Last 7 Days
            </p>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              Journal heatmap
            </span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {heatmap.map((cell) => (
              <div key={cell.date} className="space-y-1.5 text-center">
                <div
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl border text-xs font-medium transition-colors",
                    cell.count >= 3 && "border-primary/40 bg-primary text-primary-foreground",
                    cell.count === 2 && "border-primary/25 bg-primary/20 text-foreground",
                    cell.count === 1 && "border-primary/15 bg-primary/10 text-foreground",
                    cell.count === 0 && "border-border bg-muted/50 text-muted-foreground",
                    cell.isToday && "ring-2 ring-primary/35 ring-offset-2 ring-offset-background",
                  )}
                  title={`${cell.label}: ${cell.count} trade${cell.count === 1 ? "" : "s"}`}
                >
                  {cell.count}
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {cell.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
