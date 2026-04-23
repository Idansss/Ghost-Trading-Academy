import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function logUserActivity(userId: string, action: string, date = new Date()) {
  return prisma.userActivity.create({
    data: {
      userId,
      action,
      date: startOfDay(date),
    },
  });
}
