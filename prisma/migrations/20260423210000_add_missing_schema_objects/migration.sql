-- ============================================================
-- Add all schema objects that were added to schema.prisma
-- but never had corresponding migrations applied to the DB.
-- Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS throughout.
-- ============================================================

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE "EmotionState" AS ENUM (
    'CALM','CONFIDENT','ANXIOUS','FEARFUL','GREEDY','BORED','FRUSTRATED','EUPHORIC','NEUTRAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'NEW_SIGNAL','TP_HIT','SL_HIT','BREAKEVEN','NEW_RESOURCE',
    'WEEKLY_RECAP','ANNOUNCEMENT','SYSTEM','SIGNAL_UPDATE','NEW_ANNOUNCEMENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BroadcastChannel" AS ENUM ('EMAIL','IN_APP','PUSH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ChannelType" AS ENUM ('GROUP','DM','ANNOUNCEMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ChannelRole" AS ENUM ('MEMBER','MODERATOR','ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. User — 2FA + referral fields
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT,
  ADD COLUMN IF NOT EXISTS "referralCode" TEXT,
  ADD COLUMN IF NOT EXISTS "referredBy" TEXT;

-- Populate referralCode for existing rows (use id as initial value)
UPDATE "User" SET "referralCode" = id WHERE "referralCode" IS NULL;

-- Now make it unique/not-null (safe because all rows are populated)
ALTER TABLE "User" ALTER COLUMN "referralCode" SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_referralCode_key" UNIQUE ("referralCode");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Self-referential FK for referredBy
DO $$ BEGIN
  ALTER TABLE "User"
    ADD CONSTRAINT "User_referredBy_fkey"
    FOREIGN KEY ("referredBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Trade — psychology / emotion fields
ALTER TABLE "Trade"
  ADD COLUMN IF NOT EXISTS "emotionBefore" "EmotionState",
  ADD COLUMN IF NOT EXISTS "emotionDuring" "EmotionState",
  ADD COLUMN IF NOT EXISTS "emotionAfter"  "EmotionState",
  ADD COLUMN IF NOT EXISTS "followedPlan"  BOOLEAN,
  ADD COLUMN IF NOT EXISTS "revenge"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "overSized"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "movedStop"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "exitedEarly"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "mistakeNote"   TEXT,
  ADD COLUMN IF NOT EXISTS "lessonLearned" TEXT,
  ADD COLUMN IF NOT EXISTS "tradeRating"   SMALLINT;

-- 4. WeeklyReview table
CREATE TABLE IF NOT EXISTS "WeeklyReview" (
  "id"              TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "weekStartDate"   TIMESTAMP(3) NOT NULL,
  "totalTrades"     INTEGER NOT NULL,
  "winRate"         DOUBLE PRECISION NOT NULL,
  "totalPnl"        DOUBLE PRECISION NOT NULL,
  "totalR"          DOUBLE PRECISION NOT NULL,
  "bestTrade"       TEXT,
  "worstTrade"      TEXT,
  "whatWorked"      TEXT NOT NULL,
  "whatDidntWork"   TEXT NOT NULL,
  "nextWeekFocus"   TEXT NOT NULL,
  "disciplineScore" INTEGER NOT NULL,
  "overallRating"   INTEGER NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WeeklyReview_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "WeeklyReview_userId_weekStartDate_key" ON "WeeklyReview"("userId","weekStartDate");
CREATE INDEX IF NOT EXISTS "WeeklyReview_userId_createdAt_idx" ON "WeeklyReview"("userId","createdAt");
DO $$ BEGIN
  ALTER TABLE "WeeklyReview"
    ADD CONSTRAINT "WeeklyReview_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. TwoFactorBackupCode table
CREATE TABLE IF NOT EXISTS "TwoFactorBackupCode" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "codeHash"  TEXT NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TwoFactorBackupCode_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TwoFactorBackupCode_userId_usedAt_idx" ON "TwoFactorBackupCode"("userId","usedAt");
DO $$ BEGIN
  ALTER TABLE "TwoFactorBackupCode"
    ADD CONSTRAINT "TwoFactorBackupCode_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Referral table
CREATE TABLE IF NOT EXISTS "Referral" (
  "id"         TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "referredId" TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Referral_referredId_key" ON "Referral"("referredId");
CREATE INDEX IF NOT EXISTS "Referral_referrerId_createdAt_idx" ON "Referral"("referrerId","createdAt");
DO $$ BEGIN
  ALTER TABLE "Referral"
    ADD CONSTRAINT "Referral_referrerId_fkey"
    FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Referral"
    ADD CONSTRAINT "Referral_referredId_fkey"
    FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. WatchlistItem table
CREATE TABLE IF NOT EXISTS "WatchlistItem" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "symbol"     TEXT NOT NULL,
  "notes"      TEXT,
  "alertPrice" DOUBLE PRECISION,
  "addedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "WatchlistItem_userId_symbol_key" ON "WatchlistItem"("userId","symbol");
CREATE INDEX IF NOT EXISTS "WatchlistItem_userId_addedAt_idx" ON "WatchlistItem"("userId","addedAt");
DO $$ BEGIN
  ALTER TABLE "WatchlistItem"
    ADD CONSTRAINT "WatchlistItem_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 8. BroadcastMessage table
CREATE TABLE IF NOT EXISTS "BroadcastMessage" (
  "id"             TEXT NOT NULL,
  "subject"        TEXT NOT NULL,
  "body"           TEXT NOT NULL,
  "sentVia"        "BroadcastChannel"[],
  "sentAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentBy"         TEXT NOT NULL,
  "recipientCount" INTEGER NOT NULL,
  CONSTRAINT "BroadcastMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BroadcastMessage_sentAt_idx" ON "BroadcastMessage"("sentAt");
DO $$ BEGIN
  ALTER TABLE "BroadcastMessage"
    ADD CONSTRAINT "BroadcastMessage_sentBy_fkey"
    FOREIGN KEY ("sentBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 9. AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "action"    TEXT NOT NULL,
  "entity"    TEXT NOT NULL,
  "entityId"  TEXT NOT NULL,
  "metadata"  JSONB,
  "ip"        TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId","createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_action_createdAt_idx" ON "AuditLog"("action","createdAt");
DO $$ BEGIN
  ALTER TABLE "AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 10. UserActivity table
CREATE TABLE IF NOT EXISTS "UserActivity" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "date"      TIMESTAMP(3) NOT NULL,
  "action"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "UserActivity_date_idx" ON "UserActivity"("date");
CREATE INDEX IF NOT EXISTS "UserActivity_userId_date_idx" ON "UserActivity"("userId","date");
DO $$ BEGIN
  ALTER TABLE "UserActivity"
    ADD CONSTRAINT "UserActivity_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 11. NotificationPreference table
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  "id"     TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type"   "NotificationType" NOT NULL,
  "inApp"  BOOLEAN NOT NULL DEFAULT true,
  "email"  BOOLEAN NOT NULL DEFAULT false,
  "push"   BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreference_userId_type_key" ON "NotificationPreference"("userId","type");
DO $$ BEGIN
  ALTER TABLE "NotificationPreference"
    ADD CONSTRAINT "NotificationPreference_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 12. Course + CourseModule tables
CREATE TABLE IF NOT EXISTS "Course" (
  "id"          TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "coverImage"  TEXT,
  "order"       INTEGER NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CourseModule" (
  "id"       TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "title"    TEXT NOT NULL,
  "order"    INTEGER NOT NULL,
  CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CourseModule_courseId_order_idx" ON "CourseModule"("courseId","order");
DO $$ BEGIN
  ALTER TABLE "CourseModule"
    ADD CONSTRAINT "CourseModule_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 13. Resource.moduleId column (for course module linking)
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "moduleId" TEXT;
DO $$ BEGIN
  ALTER TABLE "Resource"
    ADD CONSTRAINT "Resource_moduleId_fkey"
    FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 14. Quiz + QuizQuestion + QuizAttempt + CourseEnrollment tables
CREATE TABLE IF NOT EXISTS "Quiz" (
  "id"       TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Quiz_moduleId_key" ON "Quiz"("moduleId");
DO $$ BEGIN
  ALTER TABLE "Quiz"
    ADD CONSTRAINT "Quiz_moduleId_fkey"
    FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "QuizQuestion" (
  "id"           TEXT NOT NULL,
  "quizId"       TEXT NOT NULL,
  "question"     TEXT NOT NULL,
  "options"      TEXT[] NOT NULL,
  "correctIndex" INTEGER NOT NULL,
  "explanation"  TEXT,
  CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "QuizQuestion"
    ADD CONSTRAINT "QuizQuestion_quizId_fkey"
    FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "QuizAttempt" (
  "id"      TEXT NOT NULL,
  "quizId"  TEXT NOT NULL,
  "userId"  TEXT NOT NULL,
  "score"   INTEGER NOT NULL,
  "passed"  BOOLEAN NOT NULL,
  "answers" INTEGER[] NOT NULL,
  "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "QuizAttempt_quizId_userId_takenAt_idx" ON "QuizAttempt"("quizId","userId","takenAt");
DO $$ BEGIN
  ALTER TABLE "QuizAttempt"
    ADD CONSTRAINT "QuizAttempt_quizId_fkey"
    FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "QuizAttempt"
    ADD CONSTRAINT "QuizAttempt_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CourseEnrollment" (
  "id"          TEXT NOT NULL,
  "courseId"    TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "enrolledAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CourseEnrollment_courseId_userId_key" ON "CourseEnrollment"("courseId","userId");
CREATE INDEX IF NOT EXISTS "CourseEnrollment_userId_completedAt_idx" ON "CourseEnrollment"("userId","completedAt");
DO $$ BEGIN
  ALTER TABLE "CourseEnrollment"
    ADD CONSTRAINT "CourseEnrollment_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "CourseEnrollment"
    ADD CONSTRAINT "CourseEnrollment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
