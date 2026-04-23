import { signalIdParamsSchema } from "@/lib/validators";
import { requireAuthenticatedUser } from "@/server/core/auth";
import { success } from "@/server/core/http";
import { createRouteHandler } from "@/server/core/route";
import { validateInput } from "@/server/core/validation";
import { signalService } from "@/server/services/signal-service";

export const dynamic = "force-dynamic";

export const POST = createRouteHandler(async ({ params }) => {
  const user = await requireAuthenticatedUser();
  const { id } = validateInput(signalIdParamsSchema, params);
  const data = await signalService.toggleTakenState(user.id, id);

  return success(data);
});

export const GET = createRouteHandler(async ({ params }) => {
  const user = await requireAuthenticatedUser();
  const { id } = validateInput(signalIdParamsSchema, params);
  const data = await signalService.getTakenState(user.id, id);

  return success(data);
});
