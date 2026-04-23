ALTER TABLE "User"
ADD COLUMN "pushPlayerId" TEXT,
ADD COLUMN "emailSignalAlerts" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Signal"
ADD COLUMN "outcomeNote" TEXT,
ADD COLUMN "tp1Hit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "tp2Hit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "tp3Hit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stopHit" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "SignalEmailAlertType" AS ENUM ('NEW_SIGNAL', 'SIGNAL_UPDATE');

CREATE TABLE "SignalEmailAlertLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "alertType" "SignalEmailAlertType" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignalEmailAlertLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SignalEmailAlertLog_userId_sentAt_idx" ON "SignalEmailAlertLog"("userId", "sentAt");
CREATE INDEX "SignalEmailAlertLog_signalId_sentAt_idx" ON "SignalEmailAlertLog"("signalId", "sentAt");

ALTER TABLE "SignalEmailAlertLog"
ADD CONSTRAINT "SignalEmailAlertLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SignalEmailAlertLog"
ADD CONSTRAINT "SignalEmailAlertLog_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
