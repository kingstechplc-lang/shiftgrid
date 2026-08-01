-- ShiftGrid — Postgres migration (Neon-compatible)
-- Run against any Postgres 14+ database. Idempotent: safe to re-run.
--
-- Usage:
--   psql "$DATABASE_URL" -f migration.sql
--   # or via Drizzle:
--   npx drizzle-kit migrate
--
-- This migration creates the full ShiftGrid schema: 5 enums, 9 tables,
-- indexes, foreign keys, and the unique constraint on applications.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE role AS ENUM ('super_admin', 'hospital_admin', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE offer_type AS ENUM ('locum', 'permanent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM ('draft', 'published', 'closed', 'filled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE visibility AS ENUM ('public', 'internal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM (
    'applied', 'under_review', 'shortlisted', 'offered',
    'accepted', 'declined', 'withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hospitals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  logo_url    TEXT,
  address     TEXT,
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            VARCHAR(255) NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  name             TEXT NOT NULL,
  role             role NOT NULL DEFAULT 'staff',
  hospital_id      UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  specialty        TEXT,
  experience_years INTEGER,
  resume_url       TEXT,
  availability     TEXT,
  bio              TEXT,
  location         TEXT,
  preferred_types  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id     UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type            offer_type NOT NULL,
  title           TEXT NOT NULL,
  specialty       TEXT,
  description     TEXT,
  requirements    TEXT,
  location        TEXT,
  status          offer_status NOT NULL DEFAULT 'draft',
  visibility      visibility NOT NULL DEFAULT 'public',
  deadline        TIMESTAMPTZ,

  -- Locum-only
  shift_start     TIMESTAMPTZ,
  shift_end       TIMESTAMPTZ,
  rate            REAL,
  rate_unit       TEXT,
  urgent          BOOLEAN NOT NULL DEFAULT FALSE,

  -- Permanent-only
  employment_type TEXT,
  salary_min      INTEGER,
  salary_max      INTEGER,
  benefits        TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id   UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     application_status NOT NULL DEFAULT 'applied',
  cover_note TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS applications_offer_user_unique
  ON applications(offer_id, user_id);

CREATE TABLE IF NOT EXISTS credentials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  name        TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  issue_date  DATE,
  expiry_date DATE,
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id     UUID REFERENCES offers(id) ON DELETE SET NULL,
  sender_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  payload    TEXT,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_offers (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offer_id   UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, offer_id)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id   UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  actor_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  detail     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Performance indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_hospital_id     ON users(hospital_id);
CREATE INDEX IF NOT EXISTS idx_users_role            ON users(role);

CREATE INDEX IF NOT EXISTS idx_offers_hospital_id    ON offers(hospital_id);
CREATE INDEX IF NOT EXISTS idx_offers_status         ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_type           ON offers(type);
CREATE INDEX IF NOT EXISTS idx_offers_specialty      ON offers(specialty);
CREATE INDEX IF NOT EXISTS idx_offers_created_at     ON offers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_urgent         ON offers(urgent) WHERE urgent = TRUE;

CREATE INDEX IF NOT EXISTS idx_applications_offer_id ON applications(offer_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id  ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status   ON applications(status);

CREATE INDEX IF NOT EXISTS idx_credentials_user_id   ON credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_expiry    ON credentials(expiry_date) WHERE expiry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_recipient    ON messages(recipient_id, read);
CREATE INDEX IF NOT EXISTS idx_messages_sender       ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_offer        ON messages(offer_id) WHERE offer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_created_at   ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_offer_id        ON audit_events(offer_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at trigger (auto-bump on UPDATE)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION bump_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hospitals_updated_at ON hospitals;
CREATE TRIGGER trg_hospitals_updated_at BEFORE UPDATE ON hospitals
  FOR EACH ROW EXECUTE FUNCTION bump_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION bump_updated_at();

DROP TRIGGER IF EXISTS trg_offers_updated_at ON offers;
CREATE TRIGGER trg_offers_updated_at BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION bump_updated_at();

DROP TRIGGER IF EXISTS trg_applications_updated_at ON applications;
CREATE TRIGGER trg_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION bump_updated_at();

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verification queries (run separately to confirm)
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables
--  WHERE table_schema = 'public' ORDER BY table_name;
--
-- SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;
