# Changelog

## Audit Round — 2026-04-25

### Security

- **DOMPurify sanitization** — Replaced regex-based `sanitizeHtml` with `isomorphic-dompurify`. Added `sanitizeText` (strips all tags) for plain text fields and `sanitizeRichText` (safe allowlist) for rich text. All callers migrated to `sanitizeText`; `sanitizeHtml` kept as a deprecated alias.
- **Rate limit 2FA endpoints** — Added a dedicated `"2fa"` limiter (5 req / 15 min per IP). Applied to `/api/auth/2fa/verify-login` and `/api/auth/2fa/setup`. `/api/auth/2fa/challenge` was already protected via the `"login"` limiter.
- **2FA JWT hardening** — Removed raw backup codes from the JWT payload in the setup flow; only bcrypt hashes are stored in the token. Raw codes are already returned in the response body for the user to copy.
- **Referral code strength** — Increased nanoid length from 8 to 10 characters (~50 bits of entropy). Retry cap reduced from 10 to 5 with a hard error on exhaustion.
- **Image URL guard** — `assertTrustedImageUrl` added to `/api/member-wins` POST and `/api/profile` PATCH, blocking arbitrary external image URLs.
- **Twitter share button** — Replaced `window.open()` with a proper `<a href target="_blank" rel="noopener noreferrer">` to prevent opener leaks.

### Error Monitoring

- **Sentry integration** — Installed `@sentry/nextjs`. Wired via `instrumentation.ts` (server + edge, using `register()`) and `instrumentation-client.ts` (browser). All five Sentry env vars are optional.
- **`beforeSend` redaction** — Strips `Authorization`, `Cookie`, `X-Api-Key` headers and request body from all events before they leave the process.
- **`createRouteHandler` Sentry capture** — Server 5xx errors are captured via `Sentry.captureException` with `correlationId` and route in extras. 4xx errors (expected `AppError`) are not captured to keep noise low.
- **`global-error.tsx`** — Now calls `Sentry.captureException` so root-layout crashes are always reported.

### Refactor

- **`createRouteHandler` migration** — Migrated `/api/profile` (GET + PATCH), `/api/notifications` (GET + PATCH), and `/api/member-wins` (GET + POST) from manual try/catch to `createRouteHandler`. Response shape now uses the standard `{ success, data }` envelope; `fetchJson` client handles both shapes transparently.
- **Notifications route** — Inlined query/patch Zod schemas, removed `console.error` calls (structured logging via `createRouteHandler`).
- **`tradeNote` upload purpose** — Added `tradeNote` to `SignedUploadPurpose` enum (4 MB, images only, folder `trade-notes/{userId}`).

### Bug Fixes

- **RichNotesEditor base64 images** — Image inserts now upload to Supabase Storage via `uploadFileToSupabaseStorage("tradeNote")` instead of embedding raw base64 data URIs. Shows a spinner in the toolbar during upload; surfaces errors via `sonner` toast.
- **Profile API 401 handling** — `handleApiError` now correctly maps `AppError.unauthorized()` to HTTP 401 (previous string-match against `"Unauthorized"` never matched the actual message `"Authentication required."`).
- **Login button stuck** — `setIsSubmitting(false)` now always runs in a `finally` block; previously a thrown exception left the button permanently disabled.
- **`window.prompt` for 2FA** — Replaced with a full shadcn Dialog showing the QR code, backup codes with a copy button, and a verification code input.

### Polish

- **21 loading skeletons** — All dashboard route segments that have a `page.tsx` now have a matching `loading.tsx`. New files: leaderboard, outlook, signals/[id], journal/weekly-review, journal/weekly-review/history, journal/import, notifications/preferences, community/chat/[channelId].
- **OG/Twitter metadata** — Added `og:title`, `og:description`, `og:type`, `twitter:card` to `app/layout.tsx`.
- **404 page** — Created branded `app/not-found.tsx` with Ghost icon, Dashboard and Home CTAs.
- **Root error boundary** — Created `app/global-error.tsx` to catch root-layout errors with a safe recovery UI.

## Part 1 - Core Platform Enhancements

### Trading Journal and Analytics
- Added psychology tracking fields to trades (emotion states, discipline markers, ratings, mistake/lesson notes).
- Added weekly review workflow (auto-filled stats, save/history endpoints, member UI pages).
- Added CSV trade import flow with exchange mappings, validation, duplicate detection, and import summary.
- Added psychology analytics reporting and dashboard focus insights.

### Security and Auth
- Added TOTP 2FA setup/challenge/verify/disable APIs and login flow integration.
- Added short-lived JWT utilities for secure auth handoff.
- Added Upstash-based rate limiting for auth and global API paths.
- Added sanitization utilities and trusted image URL enforcement.
- Added admin audit log utilities and audit trail pages/APIs.

### Watchlist and Notifications
- Added user watchlist APIs and member watchlist UI with live pricing.
- Added dashboard watchlist widget.
- Added notification preferences API and preferences UI.
- Grouped notification feed by time windows and improved mark-read behavior.

## Part 2 - Admin, Reporting, Education, Engagement

### Broadcast and Messaging
- Added admin broadcast composer with recipient targeting, test-send, dry-run counts, and send history.
- Added email open tracking endpoint and broadcast audit events.

### Reports
- Added member monthly PDF report generation endpoint.
- Added admin monthly report queue API and admin report send page.
- Added monthly cron trigger via `vercel.json`.

### Education
- Added course/module/quiz schema and APIs.
- Added member education hub with progress, quiz attempts, and certificates.
- Added admin course builder APIs and management UI.

### Engagement
- Added user activity logging across key actions.
- Added admin engagement metrics API/dashboard.
- Added detailed member insights dialog for admin member management.

## Completion/Polish Updates
- Added public `sitemap` and `robots` routes.
- Added landing page ISR revalidation.
- Replaced remaining journal `<img>` usage with `next/image`.
- Added PWA manifest + service worker config scaffold and install prompt UX.
- Expanded site-config support for appearance/social/maintenance fields and runtime maintenance rendering.
- Expanded Prisma seed dataset for users, signals, education, and enrollments.
