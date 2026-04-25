import {
  ChannelType,
  Direction,
  PrismaClient,
  ResourceType,
  RiskLevel,
  Role,
  SignalStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays } from "date-fns";

const prisma = new PrismaClient();

const defaultChannels = [
  {
    name: "Trading Room",
    slug: "trading-room",
    description: "Main desk chat. Admin drops live analysis and trade ideas here.",
    type: ChannelType.GROUP,
    isReadOnly: false,
  },
  {
    name: "Chart Review",
    slug: "chart-review",
    description: "Post your chart analysis here for feedback. Image-heavy channel.",
    type: ChannelType.GROUP,
    isReadOnly: false,
  },
  {
    name: "Signals Discussion",
    slug: "signals-discussion",
    description: "Discuss active signals. Auto-posts when a new signal goes live.",
    type: ChannelType.GROUP,
    isReadOnly: false,
  },
  {
    name: "Wins & Losses",
    slug: "wins-and-losses",
    description: "Share your trade results with chart screenshots.",
    type: ChannelType.GROUP,
    isReadOnly: false,
  },
  {
    name: "Announcements",
    slug: "announcements",
    description: "Admin-only posts. Members can react but not reply.",
    type: ChannelType.ANNOUNCEMENT,
    isReadOnly: true,
  },
];

const defaultTradeTags = [
  { name: "Breakout", color: "#B8860B" },
  { name: "Pullback", color: "#0E4F8A" },
  { name: "Reversal", color: "#8B2020" },
  { name: "Range", color: "#6B7280" },
  { name: "NY Session", color: "#7C3AED" },
  { name: "London Session", color: "#2563EB" },
  { name: "Asia Session", color: "#0F766E" },
  { name: "Emotional", color: "#DC2626" },
  { name: "Disciplined", color: "#15803D" },
  { name: "Revenge Trade", color: "#991B1B" },
  { name: "FOMO", color: "#C2410C" },
  { name: "A+ Setup", color: "#CA8A04" },
  { name: "B Setup", color: "#475569" },
];

// AUDIT FIX: The seed script now keeps its channel-membership helper local so
// it can run via ts-node on Windows without depending on app path aliases/ESM
// resolution quirks from runtime code.
async function addUserToDefaultChatChannels(userId: string) {
  const channels = await prisma.chatChannel.findMany({
    where: {
      type: { in: [ChannelType.GROUP, ChannelType.ANNOUNCEMENT] },
      isArchived: false,
    },
    select: { id: true },
  });

  if (!channels.length) {
    return;
  }

  await prisma.channelMember.createMany({
    data: channels.map((channel) => ({
      channelId: channel.id,
      userId,
    })),
    skipDuplicates: true,
  });
}

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);
  const memberPassword = await bcrypt.hash("member123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ghosttrading.academy" },
    update: { role: Role.ADMIN },
    create: {
      email: "admin@ghosttrading.academy",
      name: "Ghost Admin",
      password: adminPassword,
      role: Role.ADMIN,
      accountBalance: 50000,
      referralCode: "ADMIN001",
    },
  });

  const premiumUser = await prisma.user.upsert({
    where: { email: "premium@ghosttrading.academy" },
    update: { role: Role.PREMIUM },
    create: {
      email: "premium@ghosttrading.academy",
      name: "Premium Member",
      password: memberPassword,
      role: Role.PREMIUM,
      accountBalance: 10000,
      referralCode: "PREM001",
    },
  });

  const demoMembers = await Promise.all(
    Array.from({ length: 5 }).map((_, index) =>
      prisma.user.upsert({
        where: { email: `member${index + 1}@ghosttrading.academy` },
        update: {},
        create: {
          email: `member${index + 1}@ghosttrading.academy`,
          name: `Demo Member ${index + 1}`,
          password: memberPassword,
          role: index === 0 ? Role.PREMIUM : Role.MEMBER,
          accountBalance: 10000 + index * 2500,
          referralCode: `MEMBER${String(index + 1).padStart(2, "0")}`,
        },
      }),
    ),
  );

  async function seedChatChannels() {
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const channelData of defaultChannels) {
      // AUDIT FIX: Default channels are created with upsert so repeated seeds
      // do not create duplicates or drift from the canonical definitions.
      const channel = await prisma.chatChannel.upsert({
        where: { slug: channelData.slug },
        update: {
          name: channelData.name,
          description: channelData.description,
          type: channelData.type,
          isReadOnly: channelData.isReadOnly,
        },
        create: channelData,
      });

      if (channel.type !== ChannelType.DM && users.length > 0) {
        // AUDIT FIX: Membership seeding uses skipDuplicates against the
        // compound unique key to stay idempotent across re-seeds.
        await prisma.channelMember.createMany({
          data: users.map((user) => ({
            channelId: channel.id,
            userId: user.id,
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  await seedChatChannels();

  // AUDIT FIX: Seeding now backfills every user into all non-DM channels so
  // reruns and fresh environments match the registration-time behavior.
  await Promise.all([admin, premiumUser, ...demoMembers].map((user) => addUserToDefaultChatChannels(user.id)));

  await prisma.tradeTag.createMany({
    data: defaultTradeTags,
    skipDuplicates: true,
  });

  await prisma.siteConfig.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      platformName: "The Thesis Desk",
      accentColor: "#D4A017",
      defaultTimezone: "UTC",
      ctaLabel: "Apply for Access",
      ctaUrl: "/auth/login",
      tickerSymbols: ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"],
    },
  });

  const signalSeeds = Array.from({ length: 10 }).map((_, index) => ({
    coin: ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"][index % 5],
    direction: index % 2 === 0 ? Direction.LONG : Direction.SHORT,
    entryZone: `${62000 + index * 100}-${62100 + index * 100}`,
    stopLoss: `${61500 + index * 100}`,
    tp1: `${62500 + index * 100}`,
    tp2: `${62800 + index * 100}`,
    tp3: `${63200 + index * 100}`,
    riskLevel: (["LOW", "MEDIUM", "HIGH"] as const)[index % 3] as RiskLevel,
    timeframe: "4H",
    rrRatio: 2 + (index % 3) * 0.3,
    reasoning: `Demo signal reasoning ${index + 1}.`,
    status: (index % 3 === 0 ? "ACTIVE" : index % 3 === 1 ? "TP1_HIT" : "CLOSED") as SignalStatus,
    postedBy: admin.id,
    isPremiumOnly: true,
  }));

  for (const signal of signalSeeds) {
    await prisma.signal.create({
      data: signal,
    });
  }

  const courses = await Promise.all(
    ["Price Action Foundations", "Risk Management Mastery", "Trading Psychology Bootcamp"].map(
      (title, index) =>
        prisma.course.create({
          data: {
            title,
            description: `${title} course for demo environment.`,
            order: index + 1,
            isPublished: true,
          },
        }),
    ),
  );

  for (let courseIndex = 0; courseIndex < courses.length; courseIndex += 1) {
    const course = courses[courseIndex];
    const modules = await Promise.all(
      Array.from({ length: 2 }).map((_, moduleIndex) =>
        prisma.courseModule.create({
          data: {
            courseId: course.id,
            title: `Module ${moduleIndex + 1}`,
            order: moduleIndex + 1,
          },
        }),
      ),
    );

    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex += 1) {
      const module = modules[moduleIndex];
      const resource = await prisma.resource.create({
        data: {
          title: `${course.title} Resource ${moduleIndex + 1}`,
          description: "Demo course resource",
          type: ResourceType.GUIDE,
          url: "https://example.com/resource",
          tag: "Demo",
          isPremiumOnly: true,
          meta: "10 min read",
          uploadedBy: admin.id,
          moduleId: module.id,
        },
      });

      const quiz = await prisma.quiz.create({
        data: { moduleId: module.id },
      });

      await prisma.quizQuestion.createMany({
        data: [
          {
            quizId: quiz.id,
            question: `Question 1 for ${module.title}`,
            options: ["A", "B", "C", "D"],
            correctIndex: 0,
          },
          {
            quizId: quiz.id,
            question: `Question 2 for ${module.title}`,
            options: ["A", "B", "C", "D"],
            correctIndex: 1,
          },
        ],
      });

      await prisma.resourceCompletion.createMany({
        data: demoMembers.slice(0, 2).map((member) => ({
          userId: member.id,
          resourceId: resource.id,
        })),
        skipDuplicates: true,
      });
    }

    await prisma.courseEnrollment.createMany({
      data: demoMembers.map((member, memberIndex) => ({
        userId: member.id,
        courseId: course.id,
        completedAt: memberIndex < 2 ? addDays(new Date(), -(courseIndex + 1) * 3) : null,
      })),
      skipDuplicates: true,
    });
  }

  console.log("Seeded admin:", admin.email);
  console.log("Seeded premium member:", premiumUser.email);
  console.log("Seeded demo members:", demoMembers.length);
  console.log("Seeded trade tags:", defaultTradeTags.length);
  console.log("Seeded demo signals:", signalSeeds.length);
  console.log("Seeded demo courses:", courses.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
