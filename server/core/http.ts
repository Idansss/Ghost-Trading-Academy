import { AppError, type AppErrorDetail } from "@/server/core/app-error";

export type ApiMeta = Record<string, unknown>;

type SuccessEnvelope<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

type ErrorEnvelope = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: AppErrorDetail[];
  };
};

type ResponseOptions = {
  headers?: HeadersInit;
  meta?: ApiMeta;
  status?: number;
};

function json<T>(payload: SuccessEnvelope<T> | ErrorEnvelope, init: ResponseInit = {}) {
  return Response.json(payload, init);
}

export function success<T>(data: T, options: ResponseOptions = {}) {
  const body: SuccessEnvelope<T> = options.meta
    ? { success: true, data, meta: options.meta }
    : { success: true, data };

  return json(body, {
    status: options.status ?? 200,
    headers: options.headers,
  });
}

export function created<T>(
  data: T,
  location?: string,
  options: Omit<ResponseOptions, "status"> = {},
) {
  const headers = new Headers(options.headers);
  if (location) {
    headers.set("Location", location);
  }

  return success(data, {
    ...options,
    status: 201,
    headers,
  });
}

export function noContent(headers?: HeadersInit) {
  return new Response(null, {
    status: 204,
    headers,
  });
}

export function fromError(error: unknown) {
  const appError =
    error instanceof AppError
      ? error
      : new AppError("An unexpected error occurred.", 500, "INTERNAL_ERROR");

  const body: ErrorEnvelope = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details?.length ? { details: appError.details } : {}),
    },
  };

  return json(body, {
    status: appError.statusCode,
    headers: appError.headers,
  });
}
