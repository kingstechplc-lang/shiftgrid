# ShiftGrid Database Setup

Everything you need to provision, migrate, seed, and monitor the ShiftGrid database — automated.

---

## Quick start (one command)

```bash
# From your project root:
chmod +x download/db/setup-db.sh
./download/db/setup-db.sh
```

The script will:

1. Prompt you to choose a database (Neon / local Postgres / Supabase / stay on SQLite)
2. Install `drizzle-orm`, `@neondatabase/serverless`, and `drizzle-kit`
3. Copy the Drizzle schema into your project (`db/schema.ts`)
4. Run the migration (creates all 9 tables, 5 enums, indexes, foreign keys, triggers)
5. Verify the schema (counts tables + enums)
6. Seed the database with realistic sample data
7. Print ready-to-use demo credentials

**Time to complete:** ~3 minutes (most of it is you signing up for Neon).

---

## What's in this folder

| File | Purpose |
|------|---------|
| `schema.ts` | Drizzle ORM schema — drop into your project at `db/schema.ts`. Covers all 9 tables, 5 enums, relations, and TypeScript type exports. |
| `migration.sql` | Raw Postgres migration — run with `psql` or any SQL client. Idempotent (safe to re-run). Includes triggers for `updated_at` and performance indexes. |
| `seed.sql` | Raw SQL seed data — 3 hospitals, 6 admins, 8 staff, sample offers. Idempotent via `ON CONFLICT DO NOTHING`. |
| `drizzle.config.ts` | Drizzle Kit configuration — copy to project root. |
| `.env.example` | Template for all required environment variables. |
| `setup-db.sh` | The one-command automation script. |

---

## Manual setup (if you prefer to control each step)

### Option A: Drizzle Kit (recommended for Next.js projects)

```bash
# 1. Install dependencies
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# 2. Copy schema + config
cp download/db/schema.ts db/schema.ts
cp download/db/drizzle.config.ts drizzle.config.ts

# 3. Set your DATABASE_URL
cp download/db/.env.example .env
# Edit .env and paste your Neon connection string

# 4. Generate + run migration
npx drizzle-kit generate
npx drizzle-kit migrate

# 5. Seed
npx tsx scripts/seed.ts   # or: psql "$DATABASE_URL" -f download/db/seed.sql
```

### Option B: Raw SQL (works with any Postgres client)

```bash
# 1. Set your DATABASE_URL
export DATABASE_URL="postgres://user:pass@host/db?sslmode=require"

# 2. Run migration
psql "$DATABASE_URL" -f download/db/migration.sql

# 3. Seed
psql "$DATABASE_URL" -f download/db/seed.sql
```

### Option C: Neon Dashboard (no CLI)

1. Go to [console.neon.tech](https://console.neon.tech) → New Project → name it `shiftgrid`
2. Open the SQL Editor
3. Paste the contents of `migration.sql` → Run
4. Paste the contents of `seed.sql` → Run
5. Copy the connection string from Connection Details → add to your `.env`

---

## Database providers

### Neon (recommended — pairs with Vercel)

- **Free tier:** 0.5 GB storage, 100 compute hours/month
- **Serverless:** Scales to zero when idle, instant scale-up
- **Branching:** Each Vercel preview deployment gets its own DB branch automatically
- **Sign up:** [neon.tech](https://neon.tech)
- **Connection string format:** `postgres://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`

### Supabase

- **Free tier:** 500 MB storage, 2 projects
- **Sign up:** [supabase.com](https://supabase.com)
- **Connection string format:** `postgres://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres`

### Local Postgres

```bash
# macOS
brew install postgresql@16 && brew services start postgresql@16
createdb shiftgrid

# Linux (Ubuntu/Debian)
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb shiftgrid

# Docker
docker run --name shiftgrid-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=shiftgrid -p 5432:5432 -d postgres:16
```

Connection string: `postgres://postgres:postgres@localhost:5432/shiftgrid`

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

```bash
DATABASE_URL=postgres://...            # Required — Neon/Supabase/local Postgres
DIRECT_URL=postgres://...              # Optional — for migrations (bypasses pooling)
AUTH_SECRET=                           # Required — generate with: openssl rand -base64 32
BLOB_READ_WRITE_TOKEN=                 # Optional — for file uploads (Vercel Blob)
POSTMARK_API_KEY=                      # Optional — for transactional email
EMAIL_FROM="ShiftGrid <noreply@...>"   # Optional — sender address
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Schema overview

9 tables, 5 enums, 16 indexes, 4 triggers.

### Enums

| Name | Values |
|------|--------|
| `role` | `super_admin`, `hospital_admin`, `staff` |
| `offer_type` | `locum`, `permanent` |
| `offer_status` | `draft`, `published`, `closed`, `filled` |
| `visibility` | `public`, `internal` |
| `application_status` | `applied`, `under_review`, `shortlisted`, `offered`, `accepted`, `declined`, `withdrawn` |

### Tables

| Table | Purpose | Key relations |
|-------|---------|----------------|
| `hospitals` | Hospital profiles | has many `users` (admins), `offers` |
| `users` | All users (admins + staff) | belongs to `hospitals` (if admin) |
| `offers` | Locum + permanent job postings | belongs to `hospitals`, `users` (creator) |
| `applications` | Staff applications to offers | belongs to `offers`, `users` |
| `credentials` | Licenses, certs, resumes | belongs to `users` |
| `messages` | In-app messaging | belongs to `users` (sender + recipient), optionally `offers` |
| `notifications` | User notifications | belongs to `users` |
| `saved_offers` | Bookmarked offers | composite PK (user_id, offer_id) |
| `audit_events` | Status change log | belongs to `offers`, `users` (actor) |

---

## Useful commands

```bash
# Open Drizzle Studio (GUI for browsing your DB)
npx drizzle-kit studio

# Reset the database (drop + recreate all tables)
psql "$DATABASE_URL" -f download/db/migration.sql

# Re-seed (idempotent — safe to run repeatedly)
psql "$DATABASE_URL" -f download/db/seed.sql
# or
npx tsx scripts/seed.ts

# Check DB health (running app)
curl http://localhost:3000/api/health/db

# Connect via psql
psql "$DATABASE_URL"

# List all tables
psql "$DATABASE_URL" -c "\dt"

# Describe a table
psql "$DATABASE_URL" -c "\d offers"
```

---

## Demo credentials

After seeding, you can sign in with any of these (password: `password123`):

| Role | Email | Hospital |
|------|-------|----------|
| Hospital Admin | `sarah.chen@stmarys.test` | St. Mary's General |
| Hospital Admin | `priya.n@lakeside.test` | Lakeside Regional |
| Hospital Admin | `linda.f@northgate.test` | Northgate Community |
| Healthcare Staff | `james.morrison@staff.test` | — (Emergency Medicine) |
| Healthcare Staff | `anita.rao@staff.test` | — (ICU Nursing) |
| Healthcare Staff | `kevin.park@staff.test` | — (Internal Medicine) |

---

## Production checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate a strong `AUTH_SECRET` (32+ bytes random)
- [ ] Enable Neon's connection pooling (use the pooled connection string for `DATABASE_URL`)
- [ ] Set up Neon branching for preview deployments (Vercel integration)
- [ ] Configure automated backups (Neon does this by default — every 24h)
- [ ] Set up Vercel Blob for resume/credential file uploads
- [ ] Configure Postmark or SendGrid for transactional email
- [ ] Add Row-Level Security (RLS) policies on top of app-level RBAC for defense in depth
- [ ] Enable the `/api/health/db` endpoint in your uptime monitor (e.g. Better Uptime, Pingdom)
- [ ] Set up log drains to a service like Logflare or Axiom
