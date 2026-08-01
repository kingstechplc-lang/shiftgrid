#!/bin/bash
# Start ShiftGrid dev server connected to Neon Postgres
# This script fully detaches from the parent shell so the server survives.
cd /home/z/my-project
export DATABASE_URL="postgresql://neondb_owner:npg_hxc8S2RHiEsw@ep-sparkling-term-axu27glm-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
exec bun run dev
