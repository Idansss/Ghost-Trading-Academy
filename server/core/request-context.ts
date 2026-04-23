import { randomUUID } from "crypto";

export function getCorrelationId(request: Request) {
  const correlationId = request.headers.get("x-correlation-id")?.trim();
  return correlationId || randomUUID();
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return request.headers.get("x-real-ip");
}
