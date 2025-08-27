#!/bin/bash

# Direct SQL execution using the service key
SUPABASE_URL="https://kmepcdsklnnxokoimvzo.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.ILZgJNM0h6KuChk7zBFMOUZe_VftQjVOWk_BFYT7VqE"

echo "🚀 Creating donor tables using direct SQL execution"
echo ""

# Create a simple function to execute SQL
CREATE_FUNC_SQL='CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN EXECUTE sql; END; $$;'

# Execute function creation
echo "1. Creating SQL execution function..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${CREATE_FUNC_SQL}\"}" >/dev/null

# Now execute our table creation
echo "2. Creating donor tables..."

# Break down the SQL into smaller chunks
SQLS=(
  "DROP TABLE IF EXISTS donor_profiles CASCADE; DROP TABLE IF EXISTS donors CASCADE; DROP TYPE IF EXISTS donor_type CASCADE;"
  "CREATE TYPE donor_type AS ENUM ('individual', 'organization');"
  "CREATE TABLE donors (id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY, email TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL, phone TEXT, donor_type donor_type DEFAULT 'individual', email_verified BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);"
  "CREATE TABLE donor_profiles (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE, bio TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, UNIQUE(donor_id));"
  "ALTER TABLE donors ENABLE ROW LEVEL SECURITY; ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;"
  "CREATE POLICY \"Users can insert own donor record\" ON donors FOR INSERT WITH CHECK (auth.uid() = id);"
  "CREATE POLICY \"Donors can view own record\" ON donors FOR SELECT USING (auth.uid() = id);"
  "CREATE POLICY \"Users can manage own profile\" ON donor_profiles FOR ALL USING (auth.uid() = donor_id);"
  "GRANT ALL ON donors TO anon, authenticated; GRANT ALL ON donor_profiles TO anon, authenticated;"
  "INSERT INTO donors (id, email, full_name, phone, donor_type) VALUES ('a6dd2983-3dd4-4e0d-b3f6-17d38772ff32', 'test@dkdev.io', 'Test Donor Account', '555-0123', 'individual') ON CONFLICT (id) DO NOTHING;"
  "INSERT INTO donor_profiles (donor_id, bio) VALUES ('a6dd2983-3dd4-4e0d-b3f6-17d38772ff32', 'Test donor account') ON CONFLICT (donor_id) DO NOTHING;"
)

for sql in "${SQLS[@]}"; do
  echo "  Executing: ${sql:0:50}..."
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
echo "3. Verifying tables were created..."

# Test donors table
RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/donors?select=*&limit=1" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

echo -n "Donors table: "
if [[ "$RESPONSE" == "[]" ]] || [[ "$RESPONSE" == *"\"id\""* ]]; then
  echo "✅ EXISTS"
else
  echo "❌ NOT FOUND ($RESPONSE)"
fi

# Test donor_profiles table
RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/donor_profiles?select=*&limit=1" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

echo -n "Donor_profiles table: "
if [[ "$RESPONSE" == "[]" ]] || [[ "$RESPONSE" == *"\"id\""* ]]; then
  echo "✅ EXISTS"
else
  echo "❌ NOT FOUND ($RESPONSE)"
fi

echo ""
echo "✅ Donor tables setup complete!"
echo ""
echo "You can now:"
echo "1. Go to http://localhost:5173/donors/auth/register"
echo "2. Register with test@dkdev.io / TestDonor123!"
echo "3. Check email for verification link"
echo "4. After verification, log in and access dashboard"