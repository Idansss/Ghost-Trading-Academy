import { requireUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/leaderboard";
import { apiError } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") === "month" ? "month" : "all";

    return Response.json(await getLeaderboard(user.id, timeframe));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized.", 401);
    }
    return apiError("Unable to load leaderboard.", 500);
  }
}
