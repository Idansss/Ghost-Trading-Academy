import pino from "pino";

const logger = pino({
  name: "ghost-trading-academy-api",
  level:
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === "development" ? "debug" : "info"),
  base: {
    service: "ghost-trading-academy-api",
    env: process.env.NODE_ENV ?? "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "*.password",
      "*.token",
      "*.secret",
      "*.authorization",
      // AUDIT FIX: Added all sensitive field names present in this codebase.
      // Omitting these allowed hashed passwords, 2FA secrets, and refresh tokens
      // to appear in plaintext in structured log output.
      "*.passwordHash",
      "*.refreshToken",
      "*.twoFactorSecret",
      "*.codeHash",
      "*.apiKey",
      "req.headers.authorization",
      "headers.authorization",
    ],
    censor: "[REDACTED]",
  },
});

export default logger;
