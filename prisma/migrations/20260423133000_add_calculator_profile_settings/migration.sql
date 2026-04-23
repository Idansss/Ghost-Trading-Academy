ALTER TABLE "User"
  ADD COLUMN "accountSize" DOUBLE PRECISION,
  ADD COLUMN "riskPerTrade" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

UPDATE "User"
SET "accountSize" = "accountBalance"
WHERE "accountSize" IS NULL;
