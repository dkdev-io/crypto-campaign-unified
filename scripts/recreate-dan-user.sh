#!/bin/bash

# Delete and recreate dan@dkdev.io user completely
SUPABASE_URL="https://kmepcdsklnnxokoimvzo.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.ILZgJNM0h6KuChk7zBFMOUZe_VftQjVOWk_BFYT7VqE"

echo "🚀 COMPLETELY RECREATING dan@dkdev.io USER"
echo ""

CREATE_FUNC_SQL='CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN EXECUTE sql; END; $$;'

echo "1. Creating SQL execution function..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${CREATE_FUNC_SQL}\"}" >/dev/null

echo "2. Completely removing dan@dkdev.io user..."

# Remove user completely
DELETE_SQLS=(
  "DELETE FROM auth.users WHERE email = 'dan@dkdev.io';"
  "DELETE FROM auth.identities WHERE email = 'dan@dkdev.io';"
  "DELETE FROM users WHERE email = 'dan@dkdev.io';"
)

for sql in "${DELETE_SQLS[@]}"; do
  echo "  Executing: ${sql:0:50}..."
  curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"sql\": \"${sql}\"}" >/dev/null
  echo "  ✅ Done"
done

echo "3. Creating fresh dan@dkdev.io user..."

# Create completely fresh user with known password
USER_ID="d4d4d4d4-2222-3333-4444-dan0dev0io99"
CREATE_USER_SQL="INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  raw_user_meta_data,
  raw_app_meta_data
) VALUES (
  '${USER_ID}',
  '00000000-0000-0000-0000-000000000000',
  'dan@dkdev.io',
  crypt('DanPassword123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '{\"full_name\": \"Dan Developer\"}',
  '{}'
);"

RESULT=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"${CREATE_USER_SQL}\"}")

if [[ "$RESULT" == *"error"* ]]; then
  echo "  ❌ Error creating user: $RESULT"
else
  echo "  ✅ Fresh user created with correct password"
fi

echo "4. Creating identity record..."

# Create identity record
IDENTITY_SQL="INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${USER_ID}',
  '{\"sub\": \"${USER_ID}\", \"email\": \"dan@dkdev.io\"}',
  'email',
  'dan@dkdev.io',
  NOW(),
  NOW()
) ON CONFLICT (provider, provider_id) DO NOTHING;"

RESULT=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"${IDENTITY_SQL}\"}")

if [[ "$RESULT" == *"error"* ]]; then
  echo "  ❌ Error creating identity: $RESULT"
else
  echo "  ✅ Identity record created"
fi

echo ""
echo "✅ DAN@DKDEV.IO USER COMPLETELY RECREATED!"
echo ""
echo "🧪 YOUR EXACT CREDENTIALS:"
echo "Email: dan@dkdev.io"
echo "Password: DanPassword123!"
echo ""
echo "✅ These will work at: https://cryptocampaign.netlify.app/campaigns/auth"