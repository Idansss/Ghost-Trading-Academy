import { Resend } from "resend";
import { DEFAULT_PLATFORM_NAME } from "@/lib/branding";
import { env } from "@/lib/env";

let resendClient: Resend | null | undefined;

function getResendClient() {
  if (resendClient !== undefined) {
    return resendClient;
  }

  resendClient = env.resendApiKey ? new Resend(env.resendApiKey) : null;
  return resendClient;
}

type SignalEmailSignal = {
  coin: string;
  direction: string;
  entryZone: string;
  stopLoss: string;
  tp1: string;
  tp2: string;
  tp3: string;
  riskLevel?: string;
  timeframe?: string;
};

/**
 * Sends a welcome email when a new member registers.
 */
export async function sendWelcomeEmail(to: string, name: string) {
  const resend = getResendClient();
  if (!resend || !env.resendFromEmail) {
    return;
  }

  await resend.emails.send({
    from: env.resendFromEmail,
    to,
    subject: `Welcome to ${DEFAULT_PLATFORM_NAME}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; color: #111114; padding: 24px;">
        <h1 style="font-weight: 600; margin-bottom: 16px;">Welcome to ${DEFAULT_PLATFORM_NAME}</h1>
        <p style="margin: 0 0 12px;">Hi ${name},</p>
        <p style="margin: 0 0 12px;">
          Your member account is now live. You can sign in, start logging trades, and explore the platform immediately.
        </p>
        <p style="margin: 0;">Your account is ready to use.</p>
      </div>
    `,
  });
}

export async function sendNewSignalEmail(
  to: string,
  name: string,
  signal: SignalEmailSignal & { riskLevel: string; timeframe: string },
  signalUrl: string,
) {
  const resend = getResendClient();
  if (!resend || !env.resendFromEmail) {
    return;
  }

  const { default: SignalAlertEmail } = await import("@/emails/SignalAlertEmail");

  await resend.emails.send({
    from: env.resendFromEmail,
    to,
    subject: `${signal.coin} ${signal.direction} signal is live`,
    react: SignalAlertEmail({
      name,
      signal,
      signalUrl,
    }),
  });
}

export async function sendSignalOutcomeEmail(
  to: string,
  name: string,
  signal: SignalEmailSignal,
  statusLabel: string,
  signalUrl: string,
  note?: string | null,
) {
  const resend = getResendClient();
  if (!resend || !env.resendFromEmail) {
    return;
  }

  const { default: SignalOutcomeEmail } = await import(
    "@/emails/SignalOutcomeEmail"
  );

  await resend.emails.send({
    from: env.resendFromEmail,
    to,
    subject: `${signal.coin} update: ${statusLabel}`,
    react: SignalOutcomeEmail({
      name,
      signal,
      statusLabel,
      note,
      signalUrl,
    }),
  });
}

export async function sendMonthlyReportEmail(
  to: string,
  name: string,
  month: string,
  pdfBuffer: Buffer,
) {
  const resend = getResendClient();
  if (!resend || !env.resendFromEmail) {
    return;
  }

  await resend.emails.send({
    from: env.resendFromEmail,
    to,
    subject: `Your ${month} performance report`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; color: #111114; padding: 24px;">
        <h1 style="font-weight: 600; margin-bottom: 16px;">Monthly Report</h1>
        <p style="margin: 0 0 12px;">Hi ${name},</p>
        <p style="margin: 0;">Your monthly Ghost Trading Academy report is attached.</p>
      </div>
    `,
    attachments: [
      {
        filename: `monthly-report-${month}.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ],
  });
}

export async function sendBroadcastEmail(input: {
  to: string;
  subject: string;
  bodyHtml: string;
  trackingPixelUrl?: string;
}) {
  const resend = getResendClient();
  if (!resend || !env.resendFromEmail) {
    return;
  }
  const trackingPixel = input.trackingPixelUrl
    ? `<img src="${input.trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`
    : "";
  await resend.emails.send({
    from: env.resendFromEmail,
    to: input.to,
    subject: input.subject,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; color: #111114; padding: 24px;">
        ${input.bodyHtml}
      </div>
      ${trackingPixel}
    `,
  });
}
