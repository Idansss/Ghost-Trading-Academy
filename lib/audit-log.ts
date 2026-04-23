import { prisma } from "@/lib/prisma";

export async function logAdminAction(input: {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: unknown;
  ip?: string | null;
}) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: (input.metadata as object | undefined) ?? undefined,
      ip: input.ip ?? null,
    },
  });
}
