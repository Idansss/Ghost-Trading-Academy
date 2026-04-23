import { checkRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validators";
import { AppError } from "@/server/core/app-error";
import { created } from "@/server/core/http";
import { createRouteHandler } from "@/server/core/route";
import { parseJsonBody } from "@/server/core/validation";
import { authService } from "@/server/services/auth-service";

export const dynamic = "force-dynamic";

export const POST = createRouteHandler(async ({ request }) => {
  const identifier = request.headers.get("x-forwarded-for") ?? "unknown-ip";
  const rate = await checkRateLimit("register", identifier);

  if (!rate.success) {
    throw AppError.tooManyRequests(
      "Too many registration attempts. Please try again later.",
      Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000)),
    );
  }

  const payload = await parseJsonBody(request, registerSchema);
  const result = await authService.register({
    name: payload.name,
    email: payload.email,
    password: payload.password,
    referralCode: payload.referralCode,
  });

  return created(result);
});
