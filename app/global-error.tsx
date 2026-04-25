"use client";

// CLAUDE FIX: Missing global error boundary. Without this, unexpected RSC errors
// in the root layout crash the entire page with no recovery path. Next.js requires
// global-error.tsx (not error.tsx) to catch root-layout-level errors.
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f2",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <AlertTriangle
          style={{ width: 48, height: 48, color: "#8b2020", marginBottom: 24 }}
          aria-hidden="true"
        />
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>
          Something went wrong
        </h1>
        <p
          style={{
            marginTop: 8,
            color: "#6b6b70",
            fontSize: "0.875rem",
            maxWidth: 420,
          }}
        >
          An unexpected error occurred. Our team has been notified.
          {error.digest ? (
            <span style={{ display: "block", marginTop: 4, fontSize: "0.75rem" }}>
              Reference: {error.digest}
            </span>
          ) : null}
        </p>
        <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "0.75rem",
              background: "#b8860b",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
          >
            Try again
          </button>
          <a
            href="/dashboard"
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "0.75rem",
              background: "transparent",
              color: "#111",
              border: "1px solid #d4d4d8",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            Go to Dashboard
          </a>
        </div>
      </body>
    </html>
  );
}
