# Ghost Trading Academy

A full-stack trading community platform for crypto traders: signals,
trade journal, daily outlook, education hub, analytics, and community.

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment variables: `cp .env.example .env`
4. Fill in your values in `.env`
5. Push the database: `npx prisma db push`
6. Seed admin user: `npm run prisma:seed`
7. Start development server: `npm run dev`
8. Open: `http://localhost:3000`

## Default Login Credentials (after seed)

Admin: `admin@ghosttrading.academy / admin123`
Premium member: `premium@ghosttrading.academy / member123`

Change these passwords immediately after first login.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Prisma + PostgreSQL
- NextAuth.js v5
- Supabase Storage (file uploads)
- Resend (transactional email)
- Recharts (charts)
- TipTap (rich text notes editor)
- Framer Motion (animations)
- React Query (data fetching)
- Sonner (toast notifications)
- Zustand (global state)

## Backend Architecture

The API layer now follows a service-oriented backend split inside the existing
Next.js App Router project:

- `app/api/*` route handlers act as thin controllers
- `server/core/*` contains request wrappers, response envelopes, validation, auth guards, and logging
- `server/services/*` contains business logic
- `server/repositories/*` contains Prisma data access

Refactored routes currently using this pattern:

- `POST /api/auth/register`
- `GET /api/signals`, `POST /api/signals`, `PATCH /api/signals/:id`, `DELETE /api/signals/:id`
- `GET /api/signals/:id/take`, `POST /api/signals/:id/take`
- `GET /api/trades`, `POST /api/trades`, `PATCH /api/trades/:id`, `DELETE /api/trades/:id`
- `GET /api/profile`, `PATCH /api/profile`
- `GET /api/notifications`, `PATCH /api/notifications`
- `GET /api/member-wins`, `POST /api/member-wins`

Response format for the refactored endpoints:

```json
{
  "success": true,
  "data": {}
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed."
  }
}
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| DATABASE_URL | Yes | PostgreSQL connection string |
| NEXTAUTH_SECRET | Yes | Random secret for NextAuth |
| NEXTAUTH_URL | Yes | Base URL of your app. On Vercel this must be your production domain, not `http://localhost:3000` |
| NEXT_PUBLIC_SUPABASE_URL | No* | Supabase project URL for Storage (required for uploads) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | No* | Supabase anon key (browser uploads) |
| SUPABASE_SERVICE_ROLE_KEY | No* | Service role key for signed upload URLs on the server |
| SUPABASE_STORAGE_BUCKET | No | Storage bucket name (defaults to `desk-media`) |
| RESEND_API_KEY | No | Resend API key for emails |
| RESEND_FROM_EMAIL | No | From address for emails |
| NEXT_PUBLIC_CONTACT_LINK | No | WhatsApp or Telegram link for member support |
| ONESIGNAL_APP_ID | No | OneSignal app UUID for push notifications |
| ONESIGNAL_REST_API_KEY | No | OneSignal REST API key |
| UPSTASH_REDIS_REST_URL | No | Upstash Redis URL for rate limiting |
| UPSTASH_REDIS_REST_TOKEN | No | Upstash Redis token |
| NEXT_PUBLIC_APP_URL | No | Public app URL (used in OG tags and referral links) |
| SENTRY_DSN | No | Sentry DSN for server-side error reporting |
| NEXT_PUBLIC_SENTRY_DSN | No | Same DSN value for client-side error reporting |
| SENTRY_AUTH_TOKEN | No | CI-only: used to upload source maps to Sentry |
| SENTRY_ORG | No | Sentry organization slug |
| SENTRY_PROJECT | No | Sentry project slug |

## Error Monitoring

Sentry is wired up via `instrumentation.ts` (server/edge) and `instrumentation-client.ts` (browser). All five Sentry variables are optional — the app runs without them, errors are simply not forwarded to Sentry.

To enable:

1. Create a Next.js project at [sentry.io](https://sentry.io)
2. Copy the DSN from **Project Settings → Client Keys**
3. Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` in your deployment environment
4. For source map uploads in CI, also set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT`

The `beforeSend` hook strips `Authorization`, `Cookie`, and request body fields before any event is sent.

## Security

- **Rate limiting**: Login (5 req/15 min), 2FA (5 req/15 min), Register (3 req/1 h), API (100 req/1 min) — all via Upstash Redis with graceful fallback when Redis is unavailable.
- **2FA**: TOTP with encrypted secrets (AES-256), 10 bcrypt-hashed backup codes, verified via challenge/JWT flow.
- **Referral codes**: 10-character nanoid from a 32-symbol safe alphabet (~50 bits of entropy).
- **Image uploads**: Only trusted CDN URLs are accepted by API routes (`assertTrustedImageUrl`).
- **HTML sanitization**: `sanitizeText` (DOMPurify, no tags) for plain text fields; `sanitizeRichText` (safe allowlist) for rich text.
- **Security headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and a strict `Content-Security-Policy` applied to all routes.

## Health Checks

- `GET /health` - liveness
- `GET /health/ready` - readiness (database + Redis connectivity)
- `GET /api/health/db` - database-only diagnostic endpoint

## Quality Checks

- `npm run lint`
- `npm test`
- `npm run test:coverage`
- `npx tsc --noEmit`

## Deployment

1. Push code to GitHub
2. Connect the repo to Vercel
3. Add all environment variables in the Vercel dashboard
4. Deploy
