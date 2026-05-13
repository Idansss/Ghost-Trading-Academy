import { prisma } from "@/lib/prisma";

export type PublicLandingReview = {
  id: string;
  displayName: string;
  role: string;
  rating: number;
  message: string;
  createdAt: string;
};

const landingReviewSelect = {
  id: true,
  displayName: true,
  role: true,
  rating: true,
  message: true,
  createdAt: true,
} as const;

function toPublicLandingReview(review: {
  id: string;
  displayName: string;
  role: string;
  rating: number;
  message: string;
  createdAt: Date;
}): PublicLandingReview {
  return {
    ...review,
    createdAt: review.createdAt.toISOString(),
  };
}

export async function getApprovedLandingReviews(limit = 12) {
  const reviews = await prisma.landingReview.findMany({
    where: { isApproved: true },
    orderBy: { createdAt: "desc" },
    select: landingReviewSelect,
    take: limit,
  });

  return reviews.map(toPublicLandingReview);
}

export async function createLandingReview(data: {
  displayName: string;
  rating: number;
  message: string;
}) {
  const review = await prisma.landingReview.create({
    data: {
      displayName: data.displayName,
      rating: data.rating,
      message: data.message,
    },
    select: landingReviewSelect,
  });

  return toPublicLandingReview(review);
}
