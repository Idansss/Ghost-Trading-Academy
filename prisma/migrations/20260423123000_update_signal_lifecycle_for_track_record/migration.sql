ALTER TYPE "SignalStatus" RENAME TO "SignalStatus_old";

CREATE TYPE "SignalStatus" AS ENUM (
  'ACTIVE',
  'TP1_HIT',
  'TP2_HIT',
  'TP3_HIT',
  'STOPPED',
  'CANCELLED',
  'CLOSED'
);

ALTER TABLE "Signal"
  ADD COLUMN "finalPnlR" DOUBLE PRECISION;

ALTER TABLE "Signal"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Signal"
  ALTER COLUMN "status" TYPE "SignalStatus"
  USING (
    CASE "status"::text
      WHEN 'ACTIVE' THEN 'ACTIVE'
      WHEN 'PENDING' THEN 'ACTIVE'
      WHEN 'WIN' THEN 'CLOSED'
      WHEN 'LOSS' THEN 'STOPPED'
      WHEN 'BREAKEVEN' THEN 'CLOSED'
      WHEN 'CANCELLED' THEN 'CANCELLED'
      ELSE 'ACTIVE'
    END
  )::"SignalStatus";

ALTER TABLE "Signal"
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

DROP TYPE "SignalStatus_old";
