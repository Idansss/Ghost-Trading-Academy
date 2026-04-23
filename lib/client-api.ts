"use client";

/**
 * Fetches JSON from an API route and throws a standard Error on failure.
 */
export async function fetchJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => null)) as
    | {
        success?: boolean;
        data?: T;
        error?: string | { message?: string };
        message?: string;
      }
    | null;

  if (!response.ok) {
    const errorMessage =
      typeof payload?.error === "string"
        ? payload.error
        : payload?.error?.message ?? payload?.message ?? "Request failed.";
    throw new Error(errorMessage);
  }

  if (payload && payload.success === true && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}
