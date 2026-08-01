#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ShiftGrid — Automated Database Setup
# ─────────────────────────────────────────────────────────────────────────────
# This script automates the entire database provisioning flow:
#   1. Detects your environment (local Postgres, Neon, or demo SQLite)
#   2. Installs dependencies (drizzle-orm, drizzle-kit, neon-http adapter)
#   3. Runs the Postgres migration (creates all tables, enums, indexes)
#   4. Verifies the schema (counts tables + enums)
#   5. Seeds the database with realistic sample data
#   6. Prints ready-to-use demo credentials
#
# Usage:
#   chmod +x setup-db.sh
#   ./setup-db.sh                      # interactive — prompts for DATABASE_URL
#   DATABASE_URL=postgres://… ./setup-db.sh
#
# Prerequisites:
#   - Node.js 18+ and npm/bun
#   - A Postgres database (local, Neon, Supabase, RDS, etc.)
#
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()  { echo -e "${BLUE}▸${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1"; }

# ─────────────────────────────────────────────────────────────────────────────
# Step 0: Pre-flight checks
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ShiftGrid — Automated Database Setup"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Resolve script directory (so it works from anywhere)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"  # adjust if nested deeper
cd "$PROJECT_DIR"

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Resolve DATABASE_URL
# ─────────────────────────────────────────────────────────────────────────────

DATABASE_URL="${DATABASE_URL:-}"

if [[ -z "$DATABASE_URL" && -f .env ]]; then
  # Try to load from .env
  DATABASE_URL="$(grep -E '^DATABASE_URL=' .env 2>/dev/null | head -1 | cut -d'=' -f2- | tr -d '"' || true)"
fi

if [[ -z "$DATABASE_URL" ]]; then
  echo "No DATABASE_URL found."
  echo ""
  echo "Choose an option:"
  echo "  1) Use Neon Postgres (recommended — free tier, serverless)"
  echo "  2) Use a local Postgres instance"
  echo "  3) Use Supabase"
  echo "  4) Skip and stay on SQLite (demo mode)"
  echo ""
  read -rp "Enter choice [1-4]: " choice

  case "$choice" in
    1)
      echo ""
      log "Setting up Neon Postgres..."
      echo "  1. Go to: ${BLUE}https://console.neon.tech${NC}"
      echo "  2. Sign in (GitHub/Google/email)"
      echo "  3. Create a new project — name it 'shiftgrid'"
      echo "  4. Copy the connection string from 'Connection Details'"
      echo ""
      read -rp "Paste your Neon connection string: " DATABASE_URL
      if [[ -z "$DATABASE_URL" ]]; then
        err "No connection string provided. Aborting."
        exit 1
      fi
      ;;
    2)
      echo ""
      log "Using local Postgres..."
      echo "  Make sure Postgres is running on localhost:5432"
      echo "  Example DATABASE_URL: postgres://postgres:postgres@localhost:5432/shiftgrid"
      echo ""
      read -rp "Enter your DATABASE_URL: " DATABASE_URL
      ;;
    3)
      echo ""
      log "Using Supabase..."
      echo "  1. Go to: ${BLUE}https://supabase.com${NC}"
      echo "  2. Create a new project"
      echo "  3. Settings → Database → Connection string → URI"
      echo ""
      read -rp "Paste your Supabase connection string: " DATABASE_URL
      ;;
    4)
      warn "Staying on SQLite demo mode. No changes will be made."
      exit 0
      ;;
    *)
      err "Invalid choice."
      exit 1
      ;;
  esac
fi

# Validate URL starts with postgres://
if [[ ! "$DATABASE_URL" =~ ^postgres ]]; then
  err "DATABASE_URL must start with postgres:// or postgresql://"
  err "Got: $DATABASE_URL"
  exit 1
fi

ok "DATABASE_URL set: ${DATABASE_URL:0:40}…"

# Persist to .env
if ! grep -q "^DATABASE_URL=" .env 2>/dev/null; then
  echo "DATABASE_URL=$DATABASE_URL" >> .env
  ok "Saved DATABASE_URL to .env"
else
  warn ".env already has a DATABASE_URL — leaving it as-is."
fi

export DATABASE_URL

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Install dependencies
# ─────────────────────────────────────────────────────────────────────────────

log "Installing database dependencies..."

# Detect package manager
if command -v bun &>/dev/null; then
  PKG_MGR="bun"
  INSTALL="bun add"
  RUN="bun run"
elif command -v npm &>/dev/null; then
  PKG_MGR="npm"
  INSTALL="npm install"
  RUN="npm run"
else
  err "Neither bun nor npm found. Install Node.js 18+ first."
  exit 1
fi

ok "Using package manager: $PKG_MGR"

# Install Drizzle + Neon adapter
$INSTALL drizzle-orm @neondatabase/serverless
$INSTALL -D drizzle-kit

# Copy the Drizzle schema into the project if not present
if [[ ! -f db/schema.ts ]]; then
  mkdir -p db
  if [[ -f download/db/schema.ts ]]; then
    cp download/db/schema.ts db/schema.ts
    ok "Copied Drizzle schema to db/schema.ts"
  fi
fi

if [[ ! -f drizzle.config.ts ]]; then
  if [[ -f download/db/drizzle.config.ts ]]; then
    cp download/db/drizzle.config.ts drizzle.config.ts
    ok "Copied drizzle.config.ts"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Run migration
# ─────────────────────────────────────────────────────────────────────────────

log "Running database migration..."

# Try Drizzle Kit first
if command -v psql &>/dev/null; then
  # Direct psql (faster, more reliable for first run)
  if psql "$DATABASE_URL" -f download/db/migration.sql > /tmp/shiftgrid-migration.log 2>&1; then
    ok "Migration applied via psql"
  else
    warn "psql migration failed — falling back to drizzle-kit"
    cat /tmp/shiftgrid-migration.log
    $RUN drizzle-kit push --force 2>&1 | tail -20
  fi
else
  warn "psql not found — using drizzle-kit push"
  $RUN drizzle-kit push --force 2>&1 | tail -20
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 4: Verify schema
# ─────────────────────────────────────────────────────────────────────────────

log "Verifying schema..."

# Use a small Node script to count tables
cat > /tmp/verify-schema.mjs <<EOF
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
try {
  const tables = await sql\`SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name\`;
  const enums = await sql\`SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname\`;
  console.log('Tables (' + tables.length + '):', tables.map(t => t.table_name).join(', '));
  console.log('Enums  (' + enums.length + '):', enums.map(e => e.typname).join(', '));
  if (tables.length < 9) {
    console.error('Expected 9 tables, got ' + tables.length);
    process.exit(1);
  }
  console.log('Schema verification passed.');
} catch (e) {
  console.error('Verification failed:', e.message);
  process.exit(1);
}
EOF

if $PKG_MGR exec node /tmp/verify-schema.mjs 2>/dev/null || node /tmp/verify-schema.mjs 2>/dev/null; then
  ok "Schema verified"
else
  warn "Could not auto-verify schema — check manually with: psql \"\$DATABASE_URL\" -c '\\dt'"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 5: Seed the database
# ─────────────────────────────────────────────────────────────────────────────

log "Seeding database with sample data..."

# Use the seed script (works with both Prisma and Drizzle — adapt as needed)
if [[ -f scripts/seed.ts ]]; then
  # The seed script uses Prisma Client — for production, port to Drizzle.
  # For now, run the Postgres-aware version.
  if [[ -f scripts/seed-postgres.ts ]]; then
    $PKG_MGR exec tsx scripts/seed-postgres.ts 2>&1 | tail -20 || \
    warn "Seed failed — see scripts/seed-postgres.ts for manual run"
  else
    warn "No Postgres-aware seed found. Run scripts/seed.ts after porting to Drizzle."
    warn "Or use the SQL seed: psql \"\$DATABASE_URL\" -f download/db/seed.sql"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 6: Done!
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ${GREEN}✓ Database setup complete!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "  Next steps:"
echo "    1. Start your dev server:  ${BLUE}bun run dev${NC}"
echo "    2. Visit:                  ${BLUE}http://localhost:3000${NC}"
echo ""
echo "  Demo logins (password: password123):"
echo "    Hospital admin:  sarah.chen@stmarys.test"
echo "    Healthcare staff: james.morrison@staff.test"
echo ""
echo "  Useful commands:"
echo "    Open Drizzle Studio:   ${BLUE}bun run drizzle-kit studio${NC}"
echo "    Reset database:        ${BLUE}psql \"\$DATABASE_URL\" -f download/db/migration.sql${NC}"
echo ""
