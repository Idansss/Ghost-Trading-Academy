import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  debug: false,
  beforeSend(event) {
    if (event.request?.headers) {
      const safe: Record<string, string> = {};
      for (const [k, v] of Object.entries(event.request.headers)) {
        const lower = k.toLowerCase();
        if (lower === "authorization" || lower === "cookie" || lower === "x-api-key") {
          safe[k] = "[Filtered]";
        } else {
          safe[k] = v as string;
        }
      }
      event.request.headers = safe;
    }
    if (event.request) {
      event.request.data = "[Filtered]";
    }
    return event;
  },
});
