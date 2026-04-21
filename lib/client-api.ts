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

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(payload?.message ?? "Request failed.");
  }

  return (await response.json()) as T;
}
