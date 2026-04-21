# Apex VIP — Premium Trading Platform

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

Admin: `admin@apexvip.com / admin123`
VIP member: `vip@apexvip.com / vip123`

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

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| DATABASE_URL | Yes | PostgreSQL connection string |
| NEXTAUTH_SECRET | Yes | Random secret for NextAuth |
| NEXTAUTH_URL | Yes | Base URL of your app |
| UPLOADTHING_SECRET | No | Uploadthing API secret |
| UPLOADTHING_APP_ID | No | Uploadthing app ID |
| RESEND_API_KEY | No | Resend API key for emails |
| RESEND_FROM_EMAIL | No | From address for emails |
| NEXT_PUBLIC_CONTACT_LINK | No | WhatsApp or Telegram link for VIP upgrade |

## Deployment

1. Push code to GitHub
2. Connect the repo to Vercel
3. Add all environment variables in the Vercel dashboard
4. Deploy
