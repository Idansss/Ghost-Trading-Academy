import { getSignalTrackRecord } from "@/lib/signal-performance";
import { apiError } from "@/lib/utils";

// Public endpoint — no authentication required.
// Returns aggregate signal performance stats for the landing page trust signal.
export async function GET() {
  try {
    const { stats } = await getSignalTrackRecord("all");
    return Response.json(stats, {
      headers: {
        // Cache for 5 minutes on CDN/edge, revalidate in background
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load signal stats.", 500);
  }
}
