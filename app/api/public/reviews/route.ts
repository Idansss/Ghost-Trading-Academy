import { landingReviewSchema } from "@/lib/validators";
import { created, success } from "@/server/core/http";
import { createRouteHandler } from "@/server/core/route";
import { parseJsonBody } from "@/server/core/validation";
import {
  createLandingReview,
  getApprovedLandingReviews,
} from "@/server/repositories/landing-review-repository";

export const dynamic = "force-dynamic";

export const GET = createRouteHandler(async () => {
  const reviews = await getApprovedLandingReviews();
  return success({ reviews });
});

export const POST = createRouteHandler(async ({ request }) => {
  const data = await parseJsonBody(request, landingReviewSchema);
  const review = await createLandingReview(data);

  return created({ review });
});
