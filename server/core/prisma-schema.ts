import { Prisma } from "@prisma/client";
import logger from "@/server/core/logger";

export function isOptionalPrismaSchemaError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

export async function optionalPrismaQuery<T>(
  key: string,
  run: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (isOptionalPrismaSchemaError(error)) {
      logger.warn({
        type: "optional_schema_fallback",
        key,
        code: error.code,
        message: error.message,
      });
      return fallback;
    }

    throw error;
  }
}
