import { env } from "@/lib/env";

type PushNotificationPayload = {
  externalIds: string[];
  headings: Record<string, string>;
  contents: Record<string, string>;
  url: string;
  data?: Record<string, string>;
};

export function isOneSignalConfigured() {
  return Boolean(env.onesignalAppId && env.onesignalRestApiKey);
}

export async function sendPushNotification(payload: PushNotificationPayload) {
  if (!isOneSignalConfigured() || payload.externalIds.length === 0) {
    return;
  }

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${env.onesignalRestApiKey}`,
    },
    body: JSON.stringify({
      app_id: env.onesignalAppId,
      target_channel: "push",
      include_aliases: {
        external_id: payload.externalIds,
      },
      headings: payload.headings,
      contents: payload.contents,
      url: payload.url,
      data: payload.data,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OneSignal push failed: ${message}`);
  }
}
