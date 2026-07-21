# The Thesis Desk

A full-stack crypto trading workspace for market outlooks, signals, journaling, education, analytics, and community operations.

> **Status:** Active product. The public application is available at [thethesisdesk.xyz](https://thethesisdesk.xyz). Trading information is educational and analytical; it is not financial advice or a guarantee of performance.

## Product capabilities

- Market outlooks, trading signals, and structured trade-taking workflows.
- Personal trade journal with notes, review, and analytics.
- Education and community content managed through rich-text workflows.
- Member profiles, notifications, referrals, account recovery, and optional TOTP two-factor authentication.
- Administrative controls for content, members, operations, and platform health.
- Progressive-web-app support, email delivery, media storage, observability, and rate limiting.

## Architecture

```text
app/                  Next.js pages, layouts, route handlers, and health routes
components/           Product and shared interface components
server/core/          Request wrappers, validation, auth guards, and logging
server/services/      Business and workflow logic
server/repositories/  Prisma data-access layer
prisma/               PostgreSQL schema, migrations, and seed tooling
emails/               Transactional email templates
tests/                Vitest suites and supporting fixtures
```

API handlers are kept thin while business logic lives in services and persistence remains in repositories. Refactored routes use consistent success and error envelopes.

## Stack

| Layer | Technology |
| --- | --- |
| Application | Next.js 14, React 18, TypeScript |
| Interface | Tailwind CSS, Radix UI, Framer Motion, Recharts, TipTap |
| Data | PostgreSQL, Prisma, TanStack Query, Zustand |
| Identity | NextAuth.js v5, bcrypt, TOTP, JOSE |
| Services | Supabase Storage, Resend, Upstash Redis, Sentry |
| Quality | Vitest, TypeScript, ESLint |

## Local setup

### Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL

### Install and run

```bash
npm ci
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

The seed command is for isolated development environments only. Review the seed file before running it, replace all example credentials, and never reuse seeded accounts in a public or production deployment.

## Environment

Use [`.env.example`](./.env.example) as the variable-name source of truth. Key configuration groups include:

- PostgreSQL and NextAuth;
- Supabase Storage;
- Resend email delivery;
- Upstash Redis rate limiting;
- OneSignal notifications;
- Sentry error monitoring and source maps;
- canonical application and contact URLs.

Never commit real credentials. Client-prefixed values are public by design and must not contain service-role or private keys.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local development |
| `npm run build` | Generate Prisma client and build the application |
| `npm run lint` | Run the configured lint command |
| `npm test` | Run the Vitest suite |
| `npm run test:coverage` | Run tests with coverage |
| `npm run prisma:migrate` | Apply reviewed database migrations |
| `npm run prisma:seed` | Seed an isolated development database |

## Health and observability

- `GET /health` — process liveness
- `GET /health/ready` — readiness including required dependencies
- `GET /api/health/db` — database diagnostic

Sentry is optional. When configured, the integration removes authorization, cookie, and request-body fields before events are forwarded. Review filtering whenever request shapes change.

## Security

- Rate-limit authentication, registration, two-factor, and general API traffic.
- Encrypt TOTP secrets and store only hashed recovery codes.
- Restrict upload URLs to reviewed storage origins.
- Sanitize plain text and rich-text HTML before rendering.
- Apply frame, content-type, referrer, permissions, and content-security policies.
- Rotate any credential that has appeared in source, documentation, logs, or deployment output.
- Do not expose demonstration accounts on a public deployment.

## Deployment

1. provision PostgreSQL and apply migrations;
2. configure authentication and canonical URLs;
3. configure only the required storage, email, rate-limit, notification, and monitoring services;
4. run lint, typecheck, tests, and the production build;
5. verify account recovery, 2FA, uploads, health endpoints, and administrative authorization;
6. test rollback and database recovery before production use.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for deployment-specific guidance.

## Contribution context and licence

The Thesis Desk is maintained collaboratively under TrustCode System Limited. Use commit and pull-request history when describing individual contributions.

No open-source licence is currently granted. Public visibility does not by itself permit reuse, modification, or redistribution.
