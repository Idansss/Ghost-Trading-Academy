"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type OnboardingChecklistProps = {
  completed: boolean;
  completedCount: number;
  totalSteps: number;
  progressPercent: number;
  steps: Array<{
    key: string;
    title: string;
    description: string;
    href: string;
    done: boolean;
  }>;
};

export function OnboardingChecklist({
  completed,
  completedCount,
  totalSteps,
  progressPercent,
  steps,
}: OnboardingChecklistProps) {
  if (completed) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Getting Started</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount}/{totalSteps} complete
          </span>
        </CardTitle>
        <Progress value={progressPercent} />
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => (
          <Link
            key={step.key}
            href={step.href}
            className={`flex items-start gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
              step.done
                ? "text-muted-foreground"
                : "hover:bg-accent hover:text-foreground"
            }`}
          >
            {step.done ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-green)]" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="space-y-1">
              <span className={step.done ? "line-through" : ""}>{step.title}</span>
              <span className="block text-xs text-muted-foreground">{step.description}</span>
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
