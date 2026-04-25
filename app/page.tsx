import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  LineChart,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { DEFAULT_PLATFORM_NAME } from "@/lib/branding";
import { getSiteConfig } from "@/lib/site-config";
import { getSignalTrackRecord } from "@/server/repositories/signal-repository";
import { redirect } from "next/navigation";
import { LandingCta } from "@/components/landing/LandingCta";

export const revalidate = 3600;

const DEFAULT_HEADLINE = "Trade with The Thesis Desk. Stay Ahead of the Market.";
const DEFAULT_SUBHEADLINE =
  "Institutional-grade crypto signals, a professional trading journal, live market analytics, and a community of serious traders — all in one private desk.";

const FEATURES = [
  {
    icon: Zap,
    title: "Live Signals",
    description:
      "High-conviction LONG/SHORT setups with exact entry zones, stop loss, and take-profit levels — posted in real time.",
  },
  {
    icon: BookOpen,
    title: "Trading Journal",
    description:
      "Log every trade with notes, screenshots, and outcome tags. Review your patterns and eliminate bad habits.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description:
      "Win rate, average R, expectancy, and drawdown — filtered by pair, setup type, session, and date range.",
  },
  {
    icon: LineChart,
    title: "Daily Market Outlook",
    description:
      "Every session starts with a structured bias brief: what to watch, key levels, and what to avoid today.",
  },
  {
    icon: BookOpen,
    title: "Education Library",
    description:
      "Curated PDF guides and video content on price action, risk management, and trading psychology.",
  },
  {
    icon: Users,
    title: "Private Community",
    description:
      "A focused community of vetted traders sharing wins, lessons, and accountability — no noise.",
  },
] as const;

const TESTIMONIALS = [
  {
    name: "Marcus T.",
    role: "Crypto Trader — 2 years",
    quote:
      "The signals are precise. I stopped gambling and started planning. My win rate went from 38% to 61% in 90 days of journaling with the desk.",
  },
  {
    name: "Sophia R.",
    role: "Full-time Trader",
    quote:
      "The daily outlook alone is worth the membership. Knowing the desk's bias before the session opens keeps me out of low-probability trades.",
  },
  {
    name: "Daniel K.",
    role: "Part-time Trader",
    quote:
      "I used to overtrade. The journal showed me exactly which setups were costing me money. The analytics don't lie — and that accountability changed everything.",
  },
] as const;

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const [siteConfig, trackRecord] = await Promise.allSettled([
    getSiteConfig(),
    getSignalTrackRecord("all"),
  ]);

  const config =
    siteConfig.status === "fulfilled"
      ? siteConfig.value
      : {
          heroHeadline: null,
          heroSubheadline: null,
          ctaLabel: "Apply for Access",
          ctaUrl: "/auth/login",
          isWaitlistMode: false,
          platformName: DEFAULT_PLATFORM_NAME,
        };

  const stats =
    trackRecord.status === "fulfilled" ? trackRecord.value.stats : null;

  const headline = config.heroHeadline ?? DEFAULT_HEADLINE;
  const subheadline = config.heroSubheadline ?? DEFAULT_SUBHEADLINE;
  const ctaLabel = config.ctaLabel;
  const ctaUrl = config.ctaUrl;
  const platformName = config.platformName ?? DEFAULT_PLATFORM_NAME;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-black ring-1 ring-border/60">
              <Image
                src="/brand/logo.png"
                alt=""
                width={36}
                height={36}
                className="h-full w-full object-contain p-0.5"
                priority
              />
            </span>
            <span className="text-sm font-semibold tracking-tight">{platformName}</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:border-primary/40 hover:bg-accent/60"
            >
              Sign In
            </Link>
            <LandingCta label={ctaLabel} href={ctaUrl} />
          </nav>
        </div>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section
          id="hero"
          className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-28"
        >
          {/* Subtle background glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(184,134,11,0.12),transparent)]"
          />

          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 text-xs font-medium text-primary">
              <Shield className="h-3.5 w-3.5" />
              Private Trading Desk — Application Required
            </div>

            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {headline}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
              {subheadline}
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <LandingCta label={ctaLabel} href={ctaUrl} size="lg" />
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                Already a member? Sign in
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Trust stat chips */}
            {stats && stats.totalSignals > 0 && (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
                <StatChip
                  value={`${stats.winRate.toFixed(0)}%`}
                  label="Signal win rate"
                />
                <StatChip
                  value={String(stats.totalSignals)}
                  label="Signals posted"
                />
                {stats.avgR > 0 && (
                  <StatChip
                    value={`+${stats.avgR.toFixed(1)}R`}
                    label="Avg result per signal"
                  />
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────────── */}
        <section id="features" className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">
                Everything a serious trader needs
              </h2>
              <p className="mt-3 text-muted-foreground">
                Built by traders, for traders. No fluff — just tools that move the needle.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="surface-card rounded-2xl p-6 transition hover:border-primary/20 hover:shadow-sm"
                  >
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Track Record Teaser ────────────────────────────────── */}
        {stats && stats.totalSignals > 0 && (
          <section className="px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="surface-card overflow-hidden rounded-3xl p-8 sm:p-12">
                <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Live Track Record
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold sm:text-3xl">
                      Transparency you can verify
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      Every signal is logged. Every outcome is recorded. No cherry-picking.
                    </p>
                  </div>
                  <Link
                    href="/signals/track-record"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:border-primary/40 hover:bg-accent/60"
                  >
                    View full record
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <TrackRecordStat
                    value={`${stats.winRate.toFixed(1)}%`}
                    label="Win Rate"
                    positive={stats.winRate >= 50}
                  />
                  <TrackRecordStat
                    value={String(stats.totalSignals)}
                    label="Total Signals"
                  />
                  <TrackRecordStat
                    value={`${stats.avgR > 0 ? "+" : ""}${stats.avgR.toFixed(2)}R`}
                    label="Avg R / Signal"
                    positive={stats.avgR > 0}
                    negative={stats.avgR < 0}
                  />
                  <TrackRecordStat
                    value={`${stats.fullTp3Rate.toFixed(1)}%`}
                    label="Full TP3 Rate"
                    positive={stats.fullTp3Rate >= 30}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Social Proof ───────────────────────────────────────── */}
        <section id="testimonials" className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">
                What members are saying
              </h2>
              <p className="mt-3 text-muted-foreground">
                Results from real members who show up and do the work.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {TESTIMONIALS.map((testimonial) => (
                <div
                  key={testimonial.name}
                  className="surface-card flex flex-col gap-4 rounded-2xl p-6"
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        viewBox="0 0 12 12"
                        className="h-4 w-4 fill-primary"
                        aria-hidden
                      >
                        <path d="M6 0l1.5 4.5H12L8.25 7.5l1.5 4.5L6 9.375 2.25 12l1.5-4.5L0 4.5h4.5z" />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="flex-1 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div>
                    <p className="text-sm font-semibold">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What You Get ───────────────────────────────────────── */}
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="surface-card rounded-3xl p-8 sm:p-12">
              <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">
                Membership includes
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  "Real-time signal alerts via push + email",
                  "Daily market outlook & session briefings",
                  "Professional trading journal with analytics",
                  "Risk calculator with signal pre-population",
                  "Education library: PDFs, guides & video",
                  "Signal performance track record (all-time)",
                  "Community feed & weekly recaps",
                  "Streak & accountability tracker",
                  "Leaderboard with opt-in rankings",
                  "Mobile-optimised, dark & light mode",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── CTA Footer ─────────────────────────────────────────── */}
        <section
          id="apply"
          className="px-4 pb-28 pt-20 sm:px-6 sm:pb-32"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Ready to trade at a higher level?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Membership is by application only. We keep the desk small and the
              signal-to-noise ratio high.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <LandingCta label={ctaLabel} href={ctaUrl} size="lg" />
              <Link
                href="/auth/login"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Already a member? Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
              G
            </span>
            <span className="text-sm font-semibold">{platformName}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} The Thesis Desk. Private membership — not financial advice.
          </p>
          <Link
            href="/auth/login"
            className="text-xs text-muted-foreground transition hover:text-foreground"
          >
            Member login
          </Link>
        </div>
      </footer>
    </div>
  );
}

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm">
      <span className="font-bold text-primary">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function TrackRecordStat({
  value,
  label,
  positive,
  negative,
}: {
  value: string;
  label: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/30 p-5 text-center">
      <p
        className={
          positive
            ? "text-2xl font-bold text-[hsl(142,71%,38%)]"
            : negative
              ? "text-2xl font-bold text-destructive"
              : "text-2xl font-bold"
        }
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
