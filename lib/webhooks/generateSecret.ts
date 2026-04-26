import { randomBytes } from "crypto";

// CLAUDE IMPROVEMENT: Uses Node.js crypto (always available in Next.js server)
// instead of a third-party nanoid dependency. The `tv_` prefix makes secrets
// easy to identify in logs and config without revealing the actual value.
export function generateWebhookSecret(): string {
  return `tv_${randomBytes(24).toString("base64url")}`;
}
