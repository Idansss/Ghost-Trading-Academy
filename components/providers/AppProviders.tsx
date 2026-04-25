"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
// CLAUDE FIX: ReactQueryDevtools was imported unconditionally and rendered in
// production builds, exposing query cache contents to end users. Lazy-import
// so the devtools chunk is tree-shaken out of production bundles entirely.
import { lazy, Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? lazy(() =>
        import("@tanstack/react-query-devtools").then((mod) => ({
          default: mod.ReactQueryDevtools,
        })),
      )
    : null;

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="ghost-trading-academy-theme"
      disableTransitionOnChange
    >
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          {ReactQueryDevtools ? (
            <Suspense>
              <ReactQueryDevtools initialIsOpen={false} />
            </Suspense>
          ) : null}
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
