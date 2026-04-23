# Changelog

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
