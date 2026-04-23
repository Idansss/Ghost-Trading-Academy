import { signalFilterSchema, signalSchema } from "@/lib/validators";
import { requireAdminUser, requireAuthenticatedUser } from "@/server/core/auth";
import { created, success } from "@/server/core/http";
import { createRouteHandler } from "@/server/core/route";
import { parseJsonBody, parseSearchParams } from "@/server/core/validation";
import { signalService } from "@/server/services/signal-service";

export const dynamic = "force-dynamic";

export const GET = createRouteHandler(async ({ request }) => {
  const user = await requireAuthenticatedUser();
  const query = parseSearchParams(request, signalFilterSchema);
  // AUDIT FIX: Pagination params (cursor, limit) are now forwarded to the service
  // and the response includes a meta object with hasNext and nextCursor.
  const result = await signalService.listSignalsForUser({
    userId: user.id,
    status: query.status && query.status !== "ALL" ? query.status : undefined,
    cursor: query.cursor,
    limit: query.limit,
  });

  return success({ signals: result.signals }, { meta: result.meta });
});

export const POST = createRouteHandler(async ({ request, ipAddress }) => {
  const user = await requireAdminUser();
  const payload = await parseJsonBody(request, signalSchema);
  const signal = await signalService.createSignal(payload, {
    adminId: user.id,
    ipAddress,
  });

  return created(signal);
});
