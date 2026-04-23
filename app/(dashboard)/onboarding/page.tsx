import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { PageHeader } from "@/components/shared/PageHeader";
import { requireUser } from "@/lib/auth";
import { getOnboardingSnapshot } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";

export default async function OnboardingPage() {
  const sessionUser = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      emailSignalAlerts: true,
      onboardingCompleted: true,
      onboardingProgress: true,
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  // AUDIT FIX: Completed users could still navigate to /onboarding and see the
  // onboarding UI again. Redirect to dashboard immediately to prevent re-entry.
  if (user.onboardingCompleted) {
    redirect("/dashboard");
  }

  const [featuredSignal, latestSignal, resources, completions] = await Promise.all([
    prisma.signal.findFirst({
      where: {
        status: { in: ["ACTIVE", "TP1_HIT", "TP2_HIT"] },
      },
      orderBy: { postedAt: "desc" },
    }),
    prisma.signal.findFirst({
      orderBy: { postedAt: "desc" },
    }),
    prisma.resource.findMany({
      orderBy: { uploadedAt: "desc" },
      take: 3,
    }),
    prisma.resourceCompletion.findMany({
      where: { userId: user.id },
      select: { resourceId: true },
    }),
  ]);

  const completedSet = new Set(completions.map((completion) => completion.resourceId));
  const featuredResources = resources.map((resource) => ({
    ...resource,
    completedByMe: completedSet.has(resource.id),
  }));
  const onboarding = getOnboardingSnapshot(
    user.onboardingProgress,
    user.onboardingCompleted,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Set Up Your Desk"
        description="Finish the five core steps so your dashboard, journal, signals, education, and risk tooling are all ready from day one."
      />

      <OnboardingFlow
        initialOnboarding={onboarding}
        initialProfile={{
          name: user.name,
          avatarUrl: user.avatarUrl,
          emailSignalAlerts: user.emailSignalAlerts,
        }}
        featuredResources={featuredResources}
        featuredSignal={featuredSignal ?? latestSignal}
      />
    </div>
  );
}
