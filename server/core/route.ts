import * as Sentry from "@sentry/nextjs";
import { AppError } from "@/server/core/app-error";
import { fromError } from "@/server/core/http";
import logger from "@/server/core/logger";
import { getClientIp, getCorrelationId } from "@/server/core/request-context";

type MaybePromise<T> = T | Promise<T>;

type HandlerParams<TParams> = {
  request: Request;
  params: TParams;
  correlationId: string;
  ipAddress: string | null;
};

type RouteHandler<TParams> = (input: HandlerParams<TParams>) => Promise<Response>;

export function createRouteHandler<TParams = Record<string, never>>(
  handler: RouteHandler<TParams>,
) {
  return async (
    request: Request,
    context?: { params?: MaybePromise<TParams> },
  ): Promise<Response> => {
    const startedAt = Date.now();
    const correlationId = getCorrelationId(request);
    const ipAddress = getClientIp(request);
    const path = new URL(request.url).pathname;

    try {
      const params = context?.params ? await context.params : ({} as TParams);
      const response = await handler({
        request,
        params,
        correlationId,
        ipAddress,
      });

      const headers = new Headers(response.headers);
      headers.set("x-correlation-id", correlationId);

      logger.info({
        type: "request",
        correlationId,
        method: request.method,
        path,
        statusCode: response.status,
        durationMs: Date.now() - startedAt,
        ipAddress,
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      const isServerError = !(error instanceof AppError) || error.statusCode >= 500;

      if (isServerError) {
        Sentry.captureException(error, {
          extra: { correlationId, route: path, method: request.method },
        });
      }

      const logLevel = isServerError ? "error" : "warn";

      logger[logLevel]({
        type: "request_error",
        correlationId,
        method: request.method,
        path,
        durationMs: Date.now() - startedAt,
        ipAddress,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        ...(isServerError && { err: error instanceof Error ? error : undefined }),
      });

      const response = fromError(error);
      const headers = new Headers(response.headers);
      headers.set("x-correlation-id", correlationId);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
  };
}
