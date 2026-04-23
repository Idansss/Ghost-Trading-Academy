import type { Role } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { AppError } from "@/server/core/app-error";

export type AuthenticatedUser = Awaited<ReturnType<typeof requireUser>>;

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  try {
    return await requireUser();
  } catch {
    throw AppError.unauthorized();
  }
}

export async function requireRole(role: Role): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser();
  if (user.role !== role) {
    throw AppError.forbidden();
  }

  return user;
}

export async function requireAdminUser() {
  return requireRole("ADMIN");
}
