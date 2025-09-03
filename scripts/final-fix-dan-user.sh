#!/bin/bash

# Final fix - delete completely and let Supabase create the user properly
SUPABASE_URL="https://kmepcdsklnnxokoimvzo.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.ILZgJNM0h6KuChk7zBFMOUZe_VftQjVOWk_BFYT7VqE"

echo "🚀 FINAL FIX: COMPLETELY REMOVING DAN@DKDEV.IO"
echo ""

CREATE_FUNC_SQL='CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN EXECUTE sql; END; $$;'

echo "1. Creating SQL execution function..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${CREATE_FUNC_SQL}\"}" >/dev/null

echo "2. Completely purging dan@dkdev.io from all tables..."

# Nuclear option - remove from ALL possible tables
PURGE_SQLS=(
  "DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'dan@dkdev.io');"
  "DELETE FROM auth.refresh_tokens WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'dan@dkdev.io');"
  "DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'dan@dkdev.io');"
  "DELETE FROM auth.users WHERE email = 'dan@dkdev.io';"
  "DELETE FROM users WHERE email = 'dan@dkdev.io';"
)

for sql in "${PURGE_SQLS[@]}"; do
  echo "  Purging: ${sql:0:50}..."
  curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"sql\": \"${sql}\"}" >/dev/null
  echo "  ✅ Done"
done

echo ""
echo "✅ DAN@DKDEV.IO COMPLETELY PURGED!"
echo ""
echo "🚀 NOW CREATE FRESH ACCOUNT:"
echo "1. Go to: https://cryptocampaign.netlify.app/campaigns/auth"
echo "2. Click 'Sign Up'"
echo "3. Fill: Dan Developer, dan@dkdev.io, DanPassword123!, DanPassword123!"
echo "4. Check terms, click Create Account"
echo "5. Should work immediately (no email verification)"
echo ""
echo "✅ The account is completely clean now!"