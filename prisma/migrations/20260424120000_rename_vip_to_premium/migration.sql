-- Align database enum + columns with renamed Prisma identifiers (see schema history).
ALTER TYPE "Role" RENAME VALUE 'VIP' TO 'PREMIUM';

ALTER TABLE "Signal" RENAME COLUMN "isVipOnly" TO "isPremiumOnly";
ALTER TABLE "Resource" RENAME COLUMN "isVipOnly" TO "isPremiumOnly";
