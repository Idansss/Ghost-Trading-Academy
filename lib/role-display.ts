import type { Role } from "@prisma/client";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MEMBER: "Member",
  PREMIUM: "Premium",
};

export function roleDisplayName(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}
