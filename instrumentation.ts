export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { init } = await import("@sentry/nextjs");
    init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
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
        if (event.user) {
          event.user = { id: event.user.id };
        }
        return event;
      },
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const { init } = await import("@sentry/nextjs");
    init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      debug: false,
    });
  }
}
