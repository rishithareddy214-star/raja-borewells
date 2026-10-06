# Raja Borewells

Mobile-first lead generation and enquiry management website for Raja Borewells in Hyderabad.

## Setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and an `ADMIN_SESSION_SECRET` with at least 32 characters. Generate a bcrypt hash for your chosen admin password with `node -e "require('bcryptjs').hash('your-password', 12).then(console.log)"`; store only the hash in `ADMIN_PASSWORD_HASH`.
3. Install dependencies with `npm install`.
4. Apply the PostgreSQL migrations in timestamp order using the deployment's normal migration process. For a direct PostgreSQL setup, apply `prisma/migrations/20261006010000_lead_management_upgrade/migration.sql` first, then `prisma/migrations/20261006020000_normalize_enquiry_statuses/migration.sql`, against the database configured by `DATABASE_URL`. These migrations add columns/tables and normalize existing enquiry status labels; they do not drop application data. Back up and confirm the existing base schema before applying them.
5. Start the app with `npm run dev`. The admin sign-in is at `/admin/login`.

Both migrations must be applied before relying on enquiry, callback, tracking, service-area search, CRM, review, or quotation endpoints. With `DATABASE_URL` set, admin-managed business content is stored in PostgreSQL; local file storage is retained only for development without a configured database.

## Lead and admin capabilities

- Six-step quote request with opt-in browser location sharing, location confirmation, consent, honeypot, and server validation.
- PostgreSQL enquiries with yearly readable lead IDs, duplicate flags, click attribution, callback requests, site visits, contact messages, customer notes, follow-ups, and quotations.
- Admin pipeline, combined filters/search, status changes, CSV export, callback management, basic analytics, estimator settings, and secure quotation links.
- Call/WhatsApp click tracking, service-area lookup, area-specific pages generated only from the configured service-area list, privacy/terms pages, sitemap, robots, and optional offline/PWA support.

## Important configuration

- Add only verified service areas and actual projects through the admin dashboard. The app starts with no claimed project history or service-area coverage.
- Keep borewell rates empty until the business supplies real prices. The estimator remains unavailable until a rate per foot is configured.
- Replace the placeholder owner phone and WhatsApp numbers in the admin profile before launch.
- Set `NEXT_PUBLIC_APP_URL` to the production origin for canonical, sitemap, and structured-data URLs.
- Never commit `.env.local` or production secrets.
