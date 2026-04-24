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
    <div className="relative h-9 w-7" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 mx-auto h-7 w-5 rotate-45 rounded-[60%_60%_48%_48%] bg-primary" />
      <div className="absolute left-2 top-1 h-4 w-4 rotate-45 rounded-[60%_60%_40%_40%] bg-[color:var(--color-gold)]" />
      <div className="absolute left-[0.55rem] top-2.5 h-3 w-3 rotate-45 rounded-[60%_60%_40%_40%] bg-background/80" />
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
      <CardHeader className="space-y-1 pb-3">
        <CardTitle>Streak & Accountability</CardTitle>
        <p className="text-sm text-muted-foreground">
          Keep the journal habit alive and measure weekly discipline, not just outcomes.
        </p>
      </CardHeader>
      <CardContent className="space-y-3.5">
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-background/90 shadow-sm">
              <FlameIcon />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Current Streak
              </p>
              <p className="mt-1 text-3xl font-semibold leading-none" data-number="true">
                {current}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{streakCopy}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Longest Run
          </p>
          <p className="mt-1.5 text-2xl font-semibold leading-none" data-number="true">
            {longest}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Best journaling streak you have held so far.
          </p>
        </div>

        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-border"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className={cn(
                    clampedScore >= 80
                      ? "text-[color:var(--color-green)]"
                      : clampedScore >= 60
                        ? "text-primary"
                        : "text-[color:var(--color-red)]",
                  )}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-xl font-semibold" data-number="true">
                    {clampedScore.toFixed(0)}
                  </p>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    / 100
                  </p>
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Weekly Discipline
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Score based on journaling, signal reviews, education progress, and daily planning.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Last 7 Days
            </p>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
              Journal heatmap
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {heatmap.map((cell) => (
              <div key={cell.date} className="space-y-1 text-center">
                <div
                  className={cn(
                    "mx-auto flex h-8 w-8 items-center justify-center rounded-lg border text-[11px] font-medium transition-colors",
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
                <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
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
