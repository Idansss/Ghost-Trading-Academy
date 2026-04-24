import {
  NotificationType,
  Prisma,
  SignalStatus,
  type Signal,
  type SignalEmailAlertType,
} from "@prisma/client";
import { sendNewSignalEmail, sendSignalOutcomeEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { sendPushNotification } from "@/lib/onesignal";
import { prisma } from "@/lib/prisma";

const EMAIL_ALERT_COOLDOWN_MS = 10 * 60 * 1000;

type AlertRecipient = {
  id: string;
  email: string;
  name: string;
  pushPlayerId: string | null;
  emailSignalAlerts: boolean;
};

type SignalOutcomeEvent = {
  key: "TP1" | "TP2" | "TP3" | "STOP" | "CLOSED";
  notificationType: NotificationType;
  heading: string;
  body: string;
  emailLabel: string;
};

function getSignalAudienceWhere(signal: Signal): Prisma.UserWhereInput {
  return signal.isPremiumOnly
    ? { role: "PREMIUM" }
    : {
        role: {
          in: ["PREMIUM", "MEMBER"],
        },
      };
}

function getSignalPath(signalId: string) {
  return `/signals/${signalId}`;
}

function getSignalUrl(signalId: string) {
  return new URL(getSignalPath(signalId), env.appUrl).toString();
}

async function getSignalRecipients(signal: Signal) {
  return prisma.user.findMany({
    where: getSignalAudienceWhere(signal),
    select: {
      id: true,
      email: true,
      name: true,
      pushPlayerId: true,
      emailSignalAlerts: true,
    },
  });
}

async function createInAppNotifications(
  recipients: AlertRecipient[],
  type: NotificationType,
  title: string,
  message: string,
  signalId: string,
) {
  if (recipients.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: recipients.map((recipient) => ({
      userId: recipient.id,
      type,
      title,
      message,
      link: getSignalPath(signalId),
    })),
  });
}

async function getEmailEligibleRecipients(
  recipients: AlertRecipient[],
  alertType: SignalEmailAlertType,
) {
  const emailCandidates = recipients.filter((recipient) => recipient.emailSignalAlerts);

  if (emailCandidates.length === 0) {
    return [] as AlertRecipient[];
  }

  const threshold = new Date(Date.now() - EMAIL_ALERT_COOLDOWN_MS);
  const recentLogs = await prisma.signalEmailAlertLog.findMany({
    where: {
      userId: {
        in: emailCandidates.map((recipient) => recipient.id),
      },
      alertType,
      sentAt: {
        gte: threshold,
      },
    },
    select: {
      userId: true,
    },
  });

  const blockedUserIds = new Set(recentLogs.map((log) => log.userId));

  return emailCandidates.filter((recipient) => !blockedUserIds.has(recipient.id));
}

async function recordEmailAlertLog(
  recipients: AlertRecipient[],
  signalId: string,
  alertType: SignalEmailAlertType,
) {
  if (recipients.length === 0) {
    return;
  }

  await prisma.signalEmailAlertLog.createMany({
    data: recipients.map((recipient) => ({
      userId: recipient.id,
      signalId,
      alertType,
    })),
  });
}

function resolveSignalOutcomeEvent(previousSignal: Signal, signal: Signal): SignalOutcomeEvent | null {
  if (!previousSignal.stopHit && signal.stopHit) {
    return {
      key: "STOP",
      notificationType: NotificationType.SL_HIT,
      heading: `${signal.coin} stop loss hit`,
      body: `The ${signal.coin} ${signal.direction} setup hit stop loss.`,
      emailLabel: "Stop loss hit",
    };
  }

  if (!previousSignal.tp3Hit && signal.tp3Hit) {
    return {
      key: "TP3",
      notificationType: NotificationType.TP_HIT,
      heading: `${signal.coin} TP3 hit`,
      body: `The ${signal.coin} ${signal.direction} setup reached TP3.`,
      emailLabel: "TP3 hit",
    };
  }

  if (!previousSignal.tp2Hit && signal.tp2Hit) {
    return {
      key: "TP2",
      notificationType: NotificationType.TP_HIT,
      heading: `${signal.coin} TP2 hit`,
      body: `The ${signal.coin} ${signal.direction} setup reached TP2.`,
      emailLabel: "TP2 hit",
    };
  }

  if (!previousSignal.tp1Hit && signal.tp1Hit) {
    return {
      key: "TP1",
      notificationType: NotificationType.TP_HIT,
      heading: `${signal.coin} TP1 hit`,
      body: `The ${signal.coin} ${signal.direction} setup reached TP1.`,
      emailLabel: "TP1 hit",
    };
  }

  if (previousSignal.status !== signal.status && signal.status === SignalStatus.STOPPED) {
    return {
      key: "STOP",
      notificationType: NotificationType.SL_HIT,
      heading: `${signal.coin} stop loss hit`,
      body: `The ${signal.coin} ${signal.direction} setup closed at stop loss.`,
      emailLabel: "Stopped out",
    };
  }

  if (previousSignal.status !== signal.status && signal.status === SignalStatus.TP3_HIT) {
    return {
      key: "TP3",
      notificationType: NotificationType.TP_HIT,
      heading: `${signal.coin} TP3 hit`,
      body: `The ${signal.coin} ${signal.direction} setup reached TP3.`,
      emailLabel: "TP3 hit",
    };
  }

  if (previousSignal.status !== signal.status && signal.status === SignalStatus.CLOSED) {
    return {
      key: "CLOSED",
      notificationType: NotificationType.SYSTEM,
      heading: `${signal.coin} signal closed`,
      body: `The ${signal.coin} ${signal.direction} setup has been closed with a final result posted.`,
      emailLabel: "Signal closed",
    };
  }

  return null;
}

export async function dispatchPublishedSignalAlerts(signal: Signal) {
  const recipients = await getSignalRecipients(signal);
  const signalUrl = getSignalUrl(signal.id);

  await createInAppNotifications(
    recipients,
    NotificationType.NEW_SIGNAL,
    `New signal: ${signal.coin}`,
    `${signal.direction} ${signal.coin} | Entry: ${signal.entryZone} | R:R: ${signal.rrRatio}R`,
    signal.id,
  );

  await sendPushNotification({
    externalIds: recipients
      .filter((recipient) => recipient.pushPlayerId)
      .map((recipient) => recipient.id),
    headings: {
      en: `${signal.coin} ${signal.direction} signal`,
    },
    contents: {
      en: `Entry ${signal.entryZone} | Stop ${signal.stopLoss} | Open the desk now.`,
    },
    url: signalUrl,
    data: {
      signalId: signal.id,
      type: "new-signal",
    },
  }).catch(() => undefined);

  const emailRecipients = await getEmailEligibleRecipients(recipients, "NEW_SIGNAL");

  if (emailRecipients.length === 0) {
    return;
  }

  const results = await Promise.allSettled(
    emailRecipients.map((recipient) =>
      sendNewSignalEmail(
        recipient.email,
        recipient.name,
        {
          coin: signal.coin,
          direction: signal.direction,
          entryZone: signal.entryZone,
          stopLoss: signal.stopLoss,
          tp1: signal.tp1,
          tp2: signal.tp2,
          tp3: signal.tp3,
          riskLevel: signal.riskLevel,
          timeframe: signal.timeframe,
        },
        signalUrl,
      ),
    ),
  );

  const deliveredRecipients = emailRecipients.filter((_, index) => results[index]?.status === "fulfilled");

  await recordEmailAlertLog(deliveredRecipients, signal.id, "NEW_SIGNAL");
}

export async function dispatchSignalOutcomeAlerts(previousSignal: Signal, signal: Signal) {
  const outcomeEvent = resolveSignalOutcomeEvent(previousSignal, signal);

  if (!outcomeEvent) {
    return;
  }

  const recipients = await getSignalRecipients(signal);
  const signalUrl = getSignalUrl(signal.id);

  await createInAppNotifications(
    recipients,
    outcomeEvent.notificationType,
    outcomeEvent.heading,
    outcomeEvent.body,
    signal.id,
  );

  await sendPushNotification({
    externalIds: recipients
      .filter((recipient) => recipient.pushPlayerId)
      .map((recipient) => recipient.id),
    headings: {
      en: outcomeEvent.heading,
    },
    contents: {
      en: outcomeEvent.body,
    },
    url: signalUrl,
    data: {
      signalId: signal.id,
      type: `signal-${outcomeEvent.key.toLowerCase()}`,
    },
  }).catch(() => undefined);

  const emailRecipients = await getEmailEligibleRecipients(recipients, "SIGNAL_UPDATE");

  if (emailRecipients.length === 0) {
    return;
  }

  const results = await Promise.allSettled(
    emailRecipients.map((recipient) =>
      sendSignalOutcomeEmail(
        recipient.email,
        recipient.name,
        {
          coin: signal.coin,
          direction: signal.direction,
          entryZone: signal.entryZone,
          stopLoss: signal.stopLoss,
          tp1: signal.tp1,
          tp2: signal.tp2,
          tp3: signal.tp3,
        },
        outcomeEvent.emailLabel,
        signalUrl,
        signal.outcomeNote,
      ),
    ),
  );

  const deliveredRecipients = emailRecipients.filter((_, index) => results[index]?.status === "fulfilled");

  await recordEmailAlertLog(deliveredRecipients, signal.id, "SIGNAL_UPDATE");
}
