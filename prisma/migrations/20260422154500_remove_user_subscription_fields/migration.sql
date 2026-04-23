ALTER TABLE "User"
DROP COLUMN IF EXISTS "subscriptionStatus",
DROP COLUMN IF EXISTS "subscriptionExpiry";

DROP TYPE IF EXISTS "SubscriptionStatus";
