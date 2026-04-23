export type AppErrorDetail = {
  field?: string;
  message: string;
};

function toErrorCode(resource: string) {
  return resource
    .trim()
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: AppErrorDetail[];
  readonly headers?: HeadersInit;
  readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    details?: AppErrorDetail[],
    headers?: HeadersInit,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.headers = headers;
    this.isOperational = true;
    // AUDIT FIX: Without captureStackTrace the stack trace points to AppError's
    // constructor instead of the call site, making errors hard to debug in production.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message: string, details?: AppErrorDetail[]) {
    return new AppError(message, 400, "BAD_REQUEST", details);
  }

  static validation(message = "Validation failed.", details?: AppErrorDetail[]) {
    return new AppError(message, 422, "VALIDATION_ERROR", details);
  }

  static unauthorized(message = "Authentication required.") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "Access denied.") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static notFound(resource: string, id?: string) {
    const suffix = id ? ` with ID ${id}` : "";
    return new AppError(
      `${resource}${suffix} not found.`,
      404,
      `${toErrorCode(resource)}_NOT_FOUND`,
    );
  }

  static conflict(message: string, code = "CONFLICT") {
    return new AppError(message, 409, code);
  }

  static tooManyRequests(
    message = "Too many requests. Please try again later.",
    retryAfterSeconds?: number,
  ) {
    const headers = retryAfterSeconds
      ? { "Retry-After": String(retryAfterSeconds) }
      : undefined;
    return new AppError(message, 429, "RATE_LIMIT_EXCEEDED", undefined, headers);
  }
}
