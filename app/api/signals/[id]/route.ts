import {
  signalIdParamsSchema,
  signalPatchSchema,
} from "@/lib/validators";
import { requireAdminUser } from "@/server/core/auth";
import { noContent, success } from "@/server/core/http";
import { createRouteHandler } from "@/server/core/route";
import { parseJsonBody, validateInput } from "@/server/core/validation";
import { signalService } from "@/server/services/signal-service";

export const dynamic = "force-dynamic";

export const PATCH = createRouteHandler(async ({ request, params, ipAddress }) => {
  const user = await requireAdminUser();
  const { id } = validateInput(signalIdParamsSchema, params);
  const payload = await parseJsonBody(request, signalPatchSchema);
  const signal = await signalService.updateSignal(id, payload, {
    adminId: user.id,
    ipAddress,
  });

  return success(signal);
});

export const DELETE = createRouteHandler(async ({ params, ipAddress }) => {
  const user = await requireAdminUser();
  const { id } = validateInput(signalIdParamsSchema, params);

  await signalService.deleteSignal(id, {
    adminId: user.id,
    ipAddress,
  });

  return noContent();
});
