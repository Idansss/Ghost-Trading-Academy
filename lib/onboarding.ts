import { OnboardingStep } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ONBOARDING_STEP_ORDER = [
  OnboardingStep.PROFILE_SETUP,
  OnboardingStep.FIRST_TRADE_LOGGED,
  OnboardingStep.FIRST_SIGNAL_VIEWED,
  OnboardingStep.FIRST_RESOURCE_COMPLETED,
  OnboardingStep.CALCULATOR_USED,
] as const;

const stepMetadata: Record<
  OnboardingStep,
  {
    title: string;
    description: string;
    href: string;
  }
> = {
  [OnboardingStep.PROFILE_SETUP]: {
    title: "Set up your profile",
    description: "Upload an avatar and confirm the name members will see.",
    href: "/onboarding",
  },
  [OnboardingStep.FIRST_TRADE_LOGGED]: {
    title: "Log your first trade",
    description: "Capture one setup so the journal starts working for you.",
    href: "/onboarding",
  },
  [OnboardingStep.FIRST_SIGNAL_VIEWED]: {
    title: "View your first signal",
    description: "Review a live setup from the desk and mark it as seen.",
    href: "/onboarding",
  },
  [OnboardingStep.FIRST_RESOURCE_COMPLETED]: {
    title: "Complete a resource",
    description: "Finish one education item to unlock the learning path.",
    href: "/onboarding",
  },
  [OnboardingStep.CALCULATOR_USED]: {
    title: "Try the calculator",
    description: "Run one position-size calculation before you place risk.",
    href: "/onboarding",
  },
};

export type OnboardingSnapshot = ReturnType<typeof getOnboardingSnapshot>;

export function getOnboardingSnapshot(progress: OnboardingStep[], completed: boolean) {
  const progressSet = new Set(progress);
  const steps = ONBOARDING_STEP_ORDER.map((step) => ({
    key: step,
    ...stepMetadata[step],
    done: progressSet.has(step),
  }));
  const completedCount = steps.filter((step) => step.done).length;
  const totalSteps = steps.length;

  return {
    completed: completed || completedCount === totalSteps,
    completedCount,
    totalSteps,
    progressPercent: Math.round((completedCount / totalSteps) * 100),
    nextStep: steps.find((step) => !step.done) ?? null,
    steps,
  };
}

export async function markOnboardingStepComplete(userId: string, step: OnboardingStep) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      onboardingProgress: true,
      onboardingCompleted: true,
    },
  });

  if (!existing) {
    throw new Error("User not found");
  }

  const nextProgress = Array.from(new Set([...existing.onboardingProgress, step])).sort(
    (left, right) =>
      ONBOARDING_STEP_ORDER.indexOf(left) - ONBOARDING_STEP_ORDER.indexOf(right),
  );
  const nextSnapshot = getOnboardingSnapshot(nextProgress, existing.onboardingCompleted);

  return prisma.user.update({
    where: { id: userId },
    data: {
      onboardingProgress: nextProgress,
      onboardingCompleted: nextSnapshot.completed,
    },
    select: {
      onboardingProgress: true,
      onboardingCompleted: true,
    },
  });
}

export function isOnboardingStep(value: string): value is OnboardingStep {
  return ONBOARDING_STEP_ORDER.includes(value as OnboardingStep);
}
