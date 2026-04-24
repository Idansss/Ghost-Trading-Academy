# Ghost VIP - Premium Trading Platform

A full-stack trading community platform for crypto traders. VIP signals,
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

Admin: `admin@ghostvip.com / admin123`
VIP member: `vip@ghostvip.com / vip123`

Change these passwords immediately after first login.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Prisma + PostgreSQL
- NextAuth.js v5
- Uploadthing (PDF uploads)
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
- `GET /api/signals`
- `POST /api/signals`
- `PATCH /api/signals/:id`
- `DELETE /api/signals/:id`
- `GET /api/signals/:id/take`
- `POST /api/signals/:id/take`

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
| NEXT_PUBLIC_CONTACT_LINK | No | WhatsApp or Telegram link for VIP upgrade |

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
