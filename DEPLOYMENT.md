# The Thesis Desk — deployment guide

## 1) Prerequisites
- Node.js 20+
- PostgreSQL database
- Vercel project (recommended)
- OneSignal app (optional, for push)
- Resend account (optional, for email)
- Upstash Redis (for rate limiting)

## 2) Environment Variables
Populate `.env` (and production secrets) with:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` (optional; defaults to `desk-media`)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`
- `ONESIGNAL_APP_ID`
- `ONESIGNAL_API_KEY`
- `JWT_2FA_SECRET`
- `ENCRYPTION_KEY`
- `CRON_SECRET`

## 3) Install and Build
```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run build
```

## 4) Seed Demo Data
```bash
npm run prisma:seed
```

## 5) Vercel Deployment
- Connect repo to Vercel
- Add all environment variables
- Vercel now uses `npm run build:vercel`, which runs `prisma migrate deploy`
  automatically for production deployments before `next build`
- Ensure `vercel.json` is present for monthly cron
- Deploy main branch

## 6) Post-Deploy Checks
- Login flow (including 2FA challenge)
- Dashboard loads, ticker updates, watchlist works
- Notification bell/read-state works
- Monthly report endpoint returns PDF
- Admin broadcast send + open tracking works
- `/robots.txt` and `/sitemap.xml` are accessible
- PWA install prompt appears after repeat sessions on mobile

## 7) Maintenance Mode
- Admin can enable maintenance mode in Site Config
- Non-admin dashboard routes show maintenance screen while active
