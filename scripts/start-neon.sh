#!/bin/bash
# Start ShiftGrid dev server connected to Neon Postgres
# This script MUST be used to start the server — it sets DATABASE_URL correctly.
export DATABASE_URL="postgresql://neondb_owner:npg_hxc8S2RHiEsw@ep-sparkling-term-axu27glm-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
cd /home/z/my-project
exec bun run dev
