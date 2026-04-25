import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections: {
  id: string;
  title: string;
  href: string;
  intro: string;
  bullets: string[];
}[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
    intro:
      "Your home base. It pulls together performance, recent activity, and what the desk is focused on right now.",
    bullets: [
      "See headline stats (win rate, P&L context, streaks) and your equity curve.",
      "Review recent trades and monthly performance at a glance.",
      "Optional onboarding checklist helps you finish profile and setup steps in order.",
      "Cards call out the latest market bias, active signals, and ideas for what to improve next.",
      "The watchlist widget surfaces symbols you care about without opening the full watchlist page.",
    ],
  },
  {
    id: "journal",
    title: "My Journal",
    href: "/journal",
    intro:
      "Where you record every trade so the platform can calculate analytics and you can learn from real data.",
    bullets: [
      "Log entries, direction, setup, outcome, and notes for each trade.",
      "Over time this becomes the source for dashboard charts, analytics, and monthly snapshots.",
      "Use it consistently—the more you log, the clearer your edge and mistakes become.",
    ],
  },
  {
    id: "signals",
    title: "Signals",
    href: "/signals",
    intro:
      "Official trade ideas and updates from the desk: context, levels, and status in one place.",
    bullets: [
      "Filter by status to see what is active, completed, or invalided.",
      "Open a signal for full detail: pair, direction, timeframe, entry zone, and commentary.",
      "Admins may add or manage signals; members follow them to stay aligned with the team's plan.",
    ],
  },
  {
    id: "outlook",
    title: "Daily Outlook",
    href: "/outlook",
    intro:
      "The desk's read for the session: bias, key pairs, and levels worth watching.",
    bullets: [
      "Read the current market bias and planned focus before you trade.",
      "Use it to align with the same narrative as the community and education content.",
      "Admins can publish or update outlook posts from the same page.",
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    href: "/analytics",
    intro:
      "A deeper view of your journal: performance over time, behavior patterns, and exports.",
    bullets: [
      "Slice trades by date range; inspect win rate, R-multiples, and monthly tables.",
      "Charts show how your results trend; psychology and insight sections summarize patterns.",
      "Export to CSV when you need a backup or a spreadsheet for custom analysis.",
    ],
  },
  {
    id: "education",
    title: "Education",
    href: "/education",
    intro:
      "Structured courses, modules, and handouts (PDF, video, guides) in one learning hub.",
    bullets: [
      "Browse courses, open modules, and track completion progress per course.",
      "Download handouts and follow along at your own pace.",
      "Admins can build or edit content from here when in admin mode.",
    ],
  },
  {
    id: "calculator",
    title: "Calculator",
    href: "/calculator",
    intro:
      "Position sizing from your risk rules and stop distance so size matches the plan, not a guess.",
    bullets: [
      "Enter account size, risk percentage, and stop distance to get suggested size.",
      "Use it before entry to keep risk consistent across trades.",
      "You can jump from here toward logging a trade in the journal when you are ready.",
    ],
  },
  {
    id: "community",
    title: "Community",
    href: "/community",
    intro:
      "Desk-wide updates: announcements, member wins, weekly recaps, and your monthly community snapshot from trades.",
    bullets: [
      "Announcements and recaps keep everyone on the same page.",
      "Member Wins let you celebrate setups (screenshots optional); public posts are moderated first.",
      "Your monthly snapshot ties back to the trades you have journaled.",
    ],
  },
  {
    id: "chat",
    title: "Chat",
    href: "/community/chat",
    intro:
      "A dedicated space to message with other members outside of long-form posts.",
    bullets: [
      "Use it for quick questions, coordination, and conversation around the markets.",
      "Normal community guidelines apply: stay respectful and on-topic.",
    ],
  },
  {
    id: "watchlist",
    title: "Watchlist",
    href: "/watchlist",
    intro:
      "Track symbols you are monitoring, with prices and room for short notes or alert levels.",
    bullets: [
      "Add the pairs you are stalking for entries or for correlation checks.",
      "Prices refresh on a schedule so you have a single place to watch multiple names.",
    ],
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    href: "/community/leaderboard",
    intro:
      "See how members rank over a time window, based on the activity the platform measures for rankings.",
    bullets: [
      "Switch timeframes to compare this month with longer-term leaders.",
      "Use it for motivation and transparency—not as a guarantee of future results.",
    ],
  },
];

export default function PlatformGuidePage() {
  return (
    <PageTransition>
      <div className="space-y-6 pb-2">
        <PageHeader
          eyebrow="Help"
          title="Platform Guide"
          description="Short explanations of every main area so you know where to go and what to do first—no trading experience required to understand the app."
        />

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Suggested path for new members:</strong> set up your
              profile, skim <Link href="#dashboard">Dashboard</Link>, read{" "}
              <Link href="#outlook">Daily Outlook</Link>, then use{" "}
              <Link href="#journal">My Journal</Link> and <Link href="#calculator">Calculator</Link> on
              every trade. Add symbols to <Link href="#watchlist">Watchlist</Link>, check{" "}
              <Link href="#signals">Signals</Link>, and visit <Link href="#community">Community</Link> when
              you want desk updates or to share wins.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="w-full text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground sm:w-auto sm:pe-1">
            Jump to
          </span>
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              {s.title}
            </a>
          ))}
        </div>

        <div className="space-y-4">
          {sections.map((s) => (
            <Card key={s.id} id={s.id} className="scroll-mt-6">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-lg">{s.title}</CardTitle>
                  <Link
                    href={s.href}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Open page
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground">{s.intro}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
