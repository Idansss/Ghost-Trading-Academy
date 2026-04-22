import { Resend } from "resend";
import { env } from "@/lib/env";

const resend = env.resendApiKey
  ? new Resend(env.resendApiKey)
  : null;

/**
 * Sends a welcome email when a new member registers.
 */
export async function sendWelcomeEmail(to: string, name: string) {
  if (!resend || !env.resendFromEmail) {
    return;
  }

  await resend.emails.send({
    from: env.resendFromEmail,
    to,
    subject: "Welcome to Ghost VIP",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; color: #111114; padding: 24px;">
        <h1 style="font-weight: 600; margin-bottom: 16px;">Welcome to Ghost VIP</h1>
        <p style="margin: 0 0 12px;">Hi ${name},</p>
        <p style="margin: 0 0 12px;">
          Your member account is now live. You can sign in, start logging trades, and explore the platform immediately.
        </p>
        <p style="margin: 0;">Your VIP access can be upgraded by an admin inside the members panel.</p>
      </div>
    `,
  });
}
