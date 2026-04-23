import { ZodError, type ZodTypeAny } from "zod";
import { AppError, type AppErrorDetail } from "@/server/core/app-error";

export function formatZodError(error: ZodError): AppErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || undefined,
    message: issue.message,
  }));
}

export function validateInput<TSchema extends ZodTypeAny>(
  schema: TSchema,
  input: unknown,
) {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw AppError.validation("Validation failed.", formatZodError(result.error));
  }

  return result.data;
}

export async function parseJsonBody<TSchema extends ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw AppError.badRequest("Malformed JSON body.");
  }

  return validateInput(schema, body);
}

export function parseSearchParams<TSchema extends ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const query: Record<string, string | string[]> = {};

  new URL(request.url).searchParams.forEach((value, key) => {
    const existing = query[key];

    if (existing === undefined) {
      query[key] = value;
      return;
    }

    if (Array.isArray(existing)) {
      existing.push(value);
      return;
    }

    query[key] = [existing, value];
  });

  return validateInput(schema, query);
}
