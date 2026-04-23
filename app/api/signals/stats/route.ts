import { requireUser } from "@/lib/auth";
import { getSignalTrackRecord } from "@/lib/signal-performance";
import { apiError } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireUser();
    const { stats } = await getSignalTrackRecord("all");
    return Response.json(stats);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized.", 401);
    }
    return apiError("Unable to load signal stats.", 500);
  }
}
