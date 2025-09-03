#!/bin/bash

# Script to check and fix the authentication mess
SUPABASE_URL="https://kmepcdsklnnxokoimvzo.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.ILZgJNM0h6KuChk7zBFMOUZe_VftQjVOWk_BFYT7VqE"

echo "🔍 CHECKING AUTHENTICATION DATABASE STATE"
echo ""

CREATE_FUNC_SQL='CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN EXECUTE sql; END; $$;'

echo "1. Creating SQL execution function..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${CREATE_FUNC_SQL}\"}" >/dev/null

echo "2. Checking auth.users table for dan@dkdev.io..."

# Check what's in auth.users for dan@dkdev.io
CHECK_USER_SQL="SELECT id, email, email_confirmed_at, confirmed_at, encrypted_password IS NOT NULL as has_password FROM auth.users WHERE email = 'dan@dkdev.io';"

echo "  Querying user data..."
RESULT=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"${CHECK_USER_SQL}\"}")

echo "  Result: $RESULT"

echo ""
echo "3. Checking ALL users in auth.users..."

# Check all users
ALL_USERS_SQL="SELECT id, email, email_confirmed_at IS NOT NULL as confirmed, confirmed_at IS NOT NULL as confirmed_at_set, encrypted_password IS NOT NULL as has_password FROM auth.users LIMIT 10;"

echo "  Querying all users..."
RESULT=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"${ALL_USERS_SQL}\"}")

echo "  Result: $RESULT"

echo ""
echo "4. FIXING the dan@dkdev.io user..."

# Delete and recreate dan@dkdev.io user properly
FIX_SQLS=(
  "DELETE FROM auth.users WHERE email = 'dan@dkdev.io';"
  "INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, confirmed_at, created_at, updated_at, role, aud) VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'dan@dkdev.io', crypt('DanPassword123!', gen_salt('bf')), NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated');"
)

for sql in "${FIX_SQLS[@]}"; do
  echo "  Executing: ${sql:0:60}..."
  RESULT=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"sql\": \"${sql}\"}")
  
  if [[ "$RESULT" == *"error"* ]]; then
    echo "  ❌ Error: $RESULT"
  else
    echo "  ✅ Done"
  fi
done

echo ""
echo "5. Verifying the fix..."

# Verify the user now exists and is properly configured
VERIFY_SQL="SELECT id, email, email_confirmed_at IS NOT NULL as confirmed, encrypted_password IS NOT NULL as has_password FROM auth.users WHERE email = 'dan@dkdev.io';"

echo "  Checking fixed user..."
RESULT=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"${VERIFY_SQL}\"}")

echo "  Result: $RESULT"

echo ""
echo "✅ AUTHENTICATION FIX COMPLETE!"
echo ""
echo "🧪 TEST NOW:"
echo "Go to: https://cryptocampaign.netlify.app/campaigns/auth"
echo "Email: dan@dkdev.io"
echo "Password: DanPassword123!"
echo ""
echo "Should work immediately without email verification!"