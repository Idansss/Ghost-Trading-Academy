CREATE TABLE "LandingReview" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Member',
    "rating" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LandingReview_isApproved_createdAt_idx" ON "LandingReview"("isApproved", "createdAt");
