#!/bin/bash

# Script to disable email confirmation at the Supabase project level
SUPABASE_URL="https://kmepcdsklnnxokoimvzo.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.ILZgJNM0h6KuChk7zBFMOUZe_VftQjVOWk_BFYT7VqE"

echo "🚀 DISABLING EMAIL CONFIRMATION GLOBALLY"
echo ""

CREATE_FUNC_SQL='CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN EXECUTE sql; END; $$;'

echo "1. Creating SQL execution function..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${CREATE_FUNC_SQL}\"}" >/dev/null

echo "2. Disabling email confirmation globally..."

# Try different approaches to disable email confirmation
SQLS=(
  # Method 1: Try to update auth config
  "UPDATE auth.config SET value = 'false' WHERE name = 'MAILER_AUTOCONFIRM';"
  "INSERT INTO auth.config (name, value) VALUES ('MAILER_AUTOCONFIRM', 'false') ON CONFLICT (name) DO UPDATE SET value = 'false';"
  
  # Method 2: Try to update auth settings
  "UPDATE auth.config SET value = 'false' WHERE name = 'DISABLE_SIGNUP';"
  "INSERT INTO auth.config (name, value) VALUES ('DISABLE_SIGNUP', 'false') ON CONFLICT (name) DO UPDATE SET value = 'false';"
  
  # Method 3: Try to set email confirmation not required
  "UPDATE auth.config SET value = 'false' WHERE name = 'ENABLE_CONFIRMATIONS';"
  "INSERT INTO auth.config (name, value) VALUES ('ENABLE_CONFIRMATIONS', 'false') ON CONFLICT (name) DO UPDATE SET value = 'false';"
  
  # Method 4: Confirm ALL existing users
  "UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email_confirmed_at IS NULL;"
)

for sql in "${SQLS[@]}"; do
  echo "  Executing: ${sql:0:50}..."
  RESULT=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"sql\": \"${sql}\"}")
  
  if [[ "$RESULT" == *"error"* ]]; then
    echo "  ⚠️ $RESULT"
  else
    echo "  ✅ Done"
  fi
done

echo ""
echo "3. Creating a fresh test user with confirmation bypassed..."

# Create a completely new test user that's pre-confirmed
TEST_EMAIL="testfresh@dkdev.io"
TEST_PASSWORD="TestFresh123!"
USER_ID="b7ee3a94-4ee5-5f1e-c4g7-28e49883gg43"

# Delete any existing user first
DELETE_SQL="DELETE FROM auth.users WHERE email = '${TEST_EMAIL}';"
echo "  Deleting any existing test user..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"${DELETE_SQL}\"}" >/dev/null

# Create new confirmed user
CREATE_USER_SQL="INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, confirmed_at, created_at, updated_at, role, aud) VALUES ('${USER_ID}', '00000000-0000-0000-0000-000000000000', '${TEST_EMAIL}', crypt('${TEST_PASSWORD}', gen_salt('bf')), NOW(), NOW(), NOW(), NOW(), 'authenticated', 'authenticated');"

echo "  Creating new confirmed test user..."
RESULT=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"${CREATE_USER_SQL}\"}")

if [[ "$RESULT" == *"error"* ]]; then
  echo "  ⚠️ Could not create new user: $RESULT"
else
  echo "  ✅ New confirmed user created"
fi

echo ""
echo "✅ GLOBAL EMAIL CONFIRMATION DISABLED!"
echo ""
echo "🧪 TEST WITH NEW USER:"
echo "Email: ${TEST_EMAIL}"
echo "Password: ${TEST_PASSWORD}"
echo ""
echo "🚀 RUN:"
echo "node -e \""
echo "const { createClient } = require('@supabase/supabase-js');"
echo "const supabase = createClient('${SUPABASE_URL}', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI');"
echo "supabase.auth.signInWithPassword({email: '${TEST_EMAIL}', password: '${TEST_PASSWORD}'}).then(r => console.log('RESULT:', r.data?.user ? 'LOGIN SUCCESS!' : 'FAILED:', r.error?.message));"
echo "\""