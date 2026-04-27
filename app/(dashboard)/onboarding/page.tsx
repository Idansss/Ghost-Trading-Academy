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
      // CLAUDE FIX: Added so ProfileForm in onboarding mode submits the user's
      // existing values for hidden fields rather than clobbering them with defaults.
      accountSize: true,
      riskPerTrade: true,
      leaderboardOptIn: true,
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

  // CLAUDE FIX: The Resource table is empty — all content lives in the Course/
  // CourseModule hierarchy. Query published courses instead so the onboarding
  // step shows real content rather than the "No featured resources" empty state.
  const [featuredSignal, latestSignal, featuredCourses] = await Promise.all([
    prisma.signal.findFirst({
      where: {
        status: { in: ["ACTIVE", "TP1_HIT", "TP2_HIT"] },
      },
      orderBy: { postedAt: "desc" },
    }),
    prisma.signal.findFirst({
      orderBy: { postedAt: "desc" },
    }),
    prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      take: 3,
      // CLAUDE FIX: Include handoutPdfUrl so the onboarding step can open the
      // PDF and auto-advance the step without requiring a manual "Mark complete"
      select: { id: true, title: true, description: true, handoutPdfUrl: true },
    }),
  ]);
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
          accountSize: user.accountSize,
          riskPerTrade: user.riskPerTrade,
          leaderboardOptIn: user.leaderboardOptIn,
          emailSignalAlerts: user.emailSignalAlerts,
        }}
        featuredCourses={featuredCourses}
        featuredSignal={featuredSignal ?? latestSignal}
      />
    </div>
  );
}
