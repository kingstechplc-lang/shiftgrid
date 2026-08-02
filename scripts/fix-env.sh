#!/bin/bash
# Ensures .env always has the Neon URL (sandbox may overwrite it with SQLite)
NEON_URL="postgresql://neondb_owner:npg_hxc8S2RHiEsw@ep-sparkling-term-axu27glm-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
ENV_FILE="/home/z/my-project/.env"

while true; do
  if [ ! -f "$ENV_FILE" ] || ! grep -q "^DATABASE_URL=postgresql://" "$ENV_FILE"; then
    echo "DATABASE_URL=$NEON_URL" > "$ENV_FILE"
    echo "[$(date)] Fixed .env — set Neon URL"
  fi
  sleep 5
done
