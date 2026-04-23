import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { apiError } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    return Response.json(await getDashboardData(user.id, user.accountBalance));
  } catch (error) {
    console.error(error);
    return apiError("Unable to load dashboard data.", 500);
  }
}
