ALTER TABLE "User"
ADD COLUMN "journalStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastJournalDate" TIMESTAMP(3),
ADD COLUMN "disciplineScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE "SignalView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignalView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SignalView_userId_signalId_key" ON "SignalView"("userId", "signalId");
CREATE INDEX "SignalView_userId_viewedAt_idx" ON "SignalView"("userId", "viewedAt");

ALTER TABLE "SignalView"
ADD CONSTRAINT "SignalView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SignalView"
ADD CONSTRAINT "SignalView_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
