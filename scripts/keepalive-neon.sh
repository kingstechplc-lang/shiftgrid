#!/bin/bash
# Keepalive wrapper — restarts the dev server if it dies
cd /home/z/my-project
export DATABASE_URL="postgresql://neondb_owner:npg_hxc8S2RHiEsw@ep-sparkling-term-axu27glm-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
export HOME=/home/z

while true; do
  echo "[$(date)] Starting dev server..."
  bun run dev >> /home/z/my-project/dev.log 2>&1 &
  DEV_PID=$!
  echo "[$(date)] Dev server PID: $DEV_PID"
  
  # Wait for it to die
  wait $DEV_PID
  EXIT_CODE=$?
  echo "[$(date)] Dev server exited with code $EXIT_CODE, restarting in 3s..."
  sleep 3
done
