import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { apiError } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    return Response.json(await getDashboardData(user.id, user.accountBalance));
  } catch {
    return apiError("Unable to load dashboard data.", 500);
  }
}
