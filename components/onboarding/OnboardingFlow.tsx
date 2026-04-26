"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { OnboardingStep, Signal } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Target,
  UserCircle2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { ResultCards } from "@/components/calculator/ResultCards";
import { VerdictCard } from "@/components/calculator/VerdictCard";
import { useCalculator } from "@/hooks/useCalculator";
// CLAUDE FIX: Import the shared ProfileForm so onboarding uses the same save
// path as the main profile page — one source of truth.
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchJson } from "@/lib/client-api";
import { getMonthKey } from "@/lib/utils";
import { onboardingTradeSchema } from "@/lib/validators";

type OnboardingSnapshot = {
  completed: boolean;
  completedCount: number;
  totalSteps: number;
  progressPercent: number;
  nextStep: {
    key: OnboardingStep;
    title: string;
    description: string;
    href: string;
    done: boolean;
  } | null;
  steps: Array<{
    key: OnboardingStep;
    title: string;
    description: string;
    href: string;
    done: boolean;
  }>;
};

// CLAUDE FIX: Content lives in Courses, not standalone Resource records.
type FeaturedCourse = { id: string; title: string; description: string };

// CLAUDE FIX: Removed local profileStepSchema — ProfileForm uses the canonical
// profileSchema from lib/validators.ts which is the same schema the API validates.
type TradeStepValues = z.infer<typeof onboardingTradeSchema>;

const stepIcons: Record<OnboardingStep, React.ReactNode> = {
  PROFILE_SETUP: <UserCircle2 className="h-4 w-4" />,
  FIRST_TRADE_LOGGED: <Target className="h-4 w-4" />,
  FIRST_SIGNAL_VIEWED: <Zap className="h-4 w-4" />,
  FIRST_RESOURCE_COMPLETED: <BookOpen className="h-4 w-4" />,
  CALCULATOR_USED: <Lightbulb className="h-4 w-4" />,
};

function deriveTakeProfit(values: TradeStepValues) {
  const riskDistance = Math.abs(values.entryPrice - values.stopLoss);

  if (values.direction === "LONG") {
    return values.entryPrice + riskDistance * 2;
  }

  return values.entryPrice - riskDistance * 2;
}

function derivePnlPercent(outcome: TradeStepValues["outcome"]) {
  if (outcome === "WIN") return 2;
  if (outcome === "LOSS") return -1;
  return 0;
}

export function OnboardingFlow({
  initialOnboarding,
  initialProfile,
  featuredCourses,
  featuredSignal,
}: {
  initialOnboarding: OnboardingSnapshot;
  // CLAUDE FIX: Extended to include all profile fields so ProfileForm can submit
  // the user's existing values for hidden fields (riskPerTrade, leaderboardOptIn).
  initialProfile: {
    name: string;
    avatarUrl: string | null;
    accountSize: number | null;
    riskPerTrade: number;
    leaderboardOptIn: boolean;
    emailSignalAlerts: boolean;
  };
  // CLAUDE FIX: was featuredResources (Resource table) which was always empty.
  featuredCourses: FeaturedCourse[];
  featuredSignal: Signal | null;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [onboarding, setOnboarding] = useState(initialOnboarding);
  const [activeStep, setActiveStep] = useState(() => {
    const nextIncompleteIndex = initialOnboarding.steps.findIndex((step) => !step.done);
    return nextIncompleteIndex >= 0 ? nextIncompleteIndex : 0;
  });
  const { state: calculatorState, setState: setCalculatorState, results } = useCalculator({
    balance: 10000,
    riskPercent: 1,
    entry: 0,
    stopLoss: 0,
    takeProfit: 0,
  });

  const tradeForm = useForm<TradeStepValues>({
    resolver: zodResolver(onboardingTradeSchema),
    defaultValues: {
      coin: "BTC/USDT",
      direction: "LONG",
      entryPrice: undefined,
      stopLoss: undefined,
      outcome: "WIN",
    },
  });

  const completeStepMutation = useMutation({
    mutationFn: (step: OnboardingStep) =>
      fetchJson<{ onboarding: OnboardingSnapshot }>("/api/user/onboarding", {
        method: "PATCH",
        body: JSON.stringify({ step }),
      }),
    onSuccess: ({ onboarding: nextOnboarding }) => {
      setOnboarding(nextOnboarding);
      const nextIncompleteIndex = nextOnboarding.steps.findIndex((step) => !step.done);
      if (nextIncompleteIndex >= 0) {
        setActiveStep(nextIncompleteIndex);
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const tradeMutation = useMutation({
    mutationFn: (values: TradeStepValues) =>
      fetchJson("/api/trades", {
        method: "POST",
        body: JSON.stringify({
          coin: values.coin,
          direction: values.direction,
          entryPrice: values.entryPrice,
          stopLoss: values.stopLoss,
          takeProfit: deriveTakeProfit(values),
          tp2: null,
          tp3: null,
          pnlPercent: derivePnlPercent(values.outcome),
          outcome: values.outcome,
          setupType: "Onboarding Setup",
          notes: "Created during onboarding",
          tradeDate: new Date().toISOString().slice(0, 10),
        }),
      }),
    onSuccess: async () => {
      await completeStepMutation.mutateAsync("FIRST_TRADE_LOGGED");
      toast.success("First trade logged.");
    },
    onError: (error: Error) => toast.error(error.message),
  });


  useEffect(() => {
    if (onboarding.completed) {
      setActiveStep(onboarding.steps.length - 1);
    }
  }, [onboarding.completed, onboarding.steps.length]);

  const activeStepItem = onboarding.steps[activeStep] ?? onboarding.steps[0];
  const calculatorValid =
    Number(calculatorState.entry) > 0 &&
    Number(calculatorState.stopLoss) > 0 &&
    Number(calculatorState.takeProfit) > 0;

  if (onboarding.completed) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-start gap-4 p-8">
          <Badge variant="success">Onboarding complete</Badge>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">You&apos;re ready for the desk</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Your account is set up, your first trade and resource are logged, and the core tools
              are ready. Move back to the dashboard and start executing.
            </p>
          </div>
          <Button
            onClick={() => {
              router.push("/dashboard");
            }}
          >
            Go to dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
      <Card className="h-fit xl:sticky xl:top-6">
        <CardHeader>
          <CardTitle className="text-lg">Setup progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{onboarding.completedCount} of {onboarding.totalSteps} done</span>
              <span className="text-muted-foreground">{onboarding.progressPercent}%</span>
            </div>
            <Progress value={onboarding.progressPercent} />
          </div>
          <div className="space-y-2">
            {onboarding.steps.map((step, index) => (
              <button
                key={step.key}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
                  activeStep === index
                    ? "border-primary/40 bg-primary/5"
                    : "border-border hover:border-primary/30 hover:bg-accent/40"
                }`}
              >
                <span className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                  {step.done ? <CheckCircle2 className="h-4 w-4" /> : stepIcons[step.key]}
                </span>
                <span className="space-y-1">
                  <span className="block text-sm font-medium">{step.title}</span>
                  <span className="block text-xs text-muted-foreground">{step.description}</span>
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-[680px]">
        <CardHeader className="space-y-4 border-b border-border/60">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="muted">Step {activeStep + 1}</Badge>
            {activeStepItem?.done ? (
              <Badge variant="success">Completed</Badge>
            ) : (
              <Badge variant="muted">In progress</Badge>
            )}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">{activeStepItem?.title}</CardTitle>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {activeStepItem?.description}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6 md:p-8">
          {activeStepItem?.key === "PROFILE_SETUP" ? (
            <ProfileForm
              mode="onboarding"
              initialValues={{
                name: initialProfile.name,
                avatarUrl: initialProfile.avatarUrl,
                accountSize: initialProfile.accountSize,
                riskPerTrade: initialProfile.riskPerTrade,
                leaderboardOptIn: initialProfile.leaderboardOptIn,
                emailSignalAlerts: initialProfile.emailSignalAlerts,
              }}
              onSuccess={async (values) => {
                await completeStepMutation.mutateAsync("PROFILE_SETUP");
                await update({
                  user: {
                    name: values.name,
                    avatarUrl: values.avatarUrl || null,
                  },
                });
                router.refresh();
                toast.success("Profile step completed.");
              }}
            />
          ) : null}

          {activeStepItem?.key === "FIRST_TRADE_LOGGED" ? (
            <form
              className="space-y-6"
              onSubmit={tradeForm.handleSubmit(async (values) => {
                await tradeMutation.mutateAsync(values);
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pair</Label>
                  <Input {...tradeForm.register("coin")} placeholder="BTC/USDT" />
                </div>
                <div className="space-y-2">
                  <Label>Direction</Label>
                  <Select
                    value={tradeForm.watch("direction")}
                    onValueChange={(value) =>
                      tradeForm.setValue("direction", value as TradeStepValues["direction"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LONG">LONG</SelectItem>
                      <SelectItem value="SHORT">SHORT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Entry price</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="64250"
                    {...tradeForm.register("entryPrice", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stop loss</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="63600"
                    {...tradeForm.register("stopLoss", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Result</Label>
                  <Select
                    value={tradeForm.watch("outcome")}
                    onValueChange={(value) =>
                      tradeForm.setValue("outcome", value as TradeStepValues["outcome"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WIN">WIN</SelectItem>
                      <SelectItem value="LOSS">LOSS</SelectItem>
                      <SelectItem value="BREAKEVEN">BREAKEVEN</SelectItem>
                      <SelectItem value="PENDING">PENDING</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-muted/20 p-5">
                <p className="text-sm font-medium text-foreground">What this logs behind the scenes</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  We generate a default 2R target, save it under the current month key of{" "}
                  <span className="font-medium text-foreground">{getMonthKey(new Date())}</span>,
                  and mark this as your onboarding trade so you can move forward quickly.
                </p>
              </div>

              <Button disabled={tradeMutation.isPending || completeStepMutation.isPending}>
                {tradeMutation.isPending ? "Saving..." : "Log trade and continue"}
              </Button>
            </form>
          ) : null}

          {activeStepItem?.key === "FIRST_SIGNAL_VIEWED" ? (
            <div className="space-y-6">
              {featuredSignal ? (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="space-y-5 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={featuredSignal.direction === "LONG" ? "success" : "danger"}
                          >
                            {featuredSignal.direction}
                          </Badge>
                          <Badge variant="muted">{featuredSignal.status}</Badge>
                          <Badge variant="info">{featuredSignal.timeframe}</Badge>
                        </div>
                        <h3 className="text-2xl font-semibold">{featuredSignal.coin}</h3>
                      </div>
                      <div
                        className={`grid h-12 w-12 place-items-center rounded-full ${
                          featuredSignal.direction === "LONG"
                            ? "bg-[color:var(--color-green-light)] text-[color:var(--color-green)]"
                            : "bg-[color:var(--color-red-light)] text-[color:var(--color-red)]"
                        }`}
                      >
                        {featuredSignal.direction === "LONG" ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5" />
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                      {[
                        ["Entry", featuredSignal.entryZone],
                        ["Stop", featuredSignal.stopLoss],
                        ["TP1", featuredSignal.tp1],
                        ["TP2", featuredSignal.tp2],
                        ["TP3", featuredSignal.tp3],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-border bg-background p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                            {label}
                          </p>
                          <p className="mt-2 font-medium text-foreground">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-primary/20 bg-background/70 p-4">
                      <p className="text-sm text-muted-foreground">{featuredSignal.reasoning}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button asChild variant="outline">
                        <Link href={`/signals/${featuredSignal.id}`}>Open full signal</Link>
                      </Button>
                      <Button
                        disabled={completeStepMutation.isPending}
                        onClick={async () => {
                          await completeStepMutation.mutateAsync("FIRST_SIGNAL_VIEWED");
                          toast.success("Signal review step completed.");
                        }}
                      >
                        Mark as viewed
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="space-y-4 p-6">
                    <p className="font-medium">No active signal available right now</p>
                    <p className="text-sm text-muted-foreground">
                      The desk has not published an active or pending signal yet.
                    </p>
                    <Button
                      disabled={completeStepMutation.isPending}
                      onClick={async () => {
                        await completeStepMutation.mutateAsync("FIRST_SIGNAL_VIEWED");
                      }}
                    >
                      Continue anyway
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}

          {/* CLAUDE FIX: was querying the empty Resource table. Now shows published
              Courses so members see real content ("Price action" etc.) and can mark
              the step complete after visiting education. */}
          {activeStepItem?.key === "FIRST_RESOURCE_COMPLETED" ? (
            <div className="space-y-6">
              {featuredCourses.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-3">
                  {featuredCourses.map((course) => (
                    <Card key={course.id} className="h-full">
                      <CardContent className="flex h-full flex-col gap-4 p-5">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">{course.description}</p>
                        </div>
                        <div className="mt-auto flex flex-col gap-2">
                          <Button asChild variant="outline">
                            <Link href="/education">
                              Open in education
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="space-y-4 p-6">
                    <p className="text-sm text-muted-foreground">
                      No courses have been published yet. Visit the education page to check for new content.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/education">Go to education</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
              <Button
                disabled={completeStepMutation.isPending || activeStepItem.done}
                onClick={async () => {
                  await completeStepMutation.mutateAsync("FIRST_RESOURCE_COMPLETED");
                  toast.success("Resource step completed.");
                }}
              >
                {activeStepItem.done ? "Step completed" : "Mark as complete"}
              </Button>
            </div>
          ) : null}

          {activeStepItem?.key === "CALCULATOR_USED" ? (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Run one calculation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CalculatorForm value={calculatorState} onChange={setCalculatorState} />
                  </CardContent>
                </Card>
                <div className="space-y-6">
                  <ResultCards {...results} />
                  <VerdictCard rrRatio={results.rrRatio} />
                </div>
              </div>

              <Button
                disabled={!calculatorValid || completeStepMutation.isPending}
                onClick={async () => {
                  await completeStepMutation.mutateAsync("CALCULATOR_USED");
                  toast.success("Onboarding complete.");
                  router.push("/dashboard");
                }}
              >
                Finish onboarding
              </Button>
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="ghost"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((current) => Math.max(current - 1, 0))}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={activeStep >= onboarding.steps.length - 1}
              onClick={() =>
                setActiveStep((current) => Math.min(current + 1, onboarding.steps.length - 1))
              }
            >
              Next step
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
