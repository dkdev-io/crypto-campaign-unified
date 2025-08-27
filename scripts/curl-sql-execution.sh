#!/bin/bash

# Load environment
source .env

# Supabase connection details
SUPABASE_URL="https://kmepcdsklnnxokoimvzo.supabase.co"
SERVICE_KEY="$MIGRATION_SUPABASE_SERVICE_KEY"

if [ -z "$SERVICE_KEY" ]; then
    echo "❌ Missing MIGRATION_SUPABASE_SERVICE_KEY"
    exit 1
fi

echo "🚀 Executing SQL to create donor tables..."
echo ""

# First, let's try to create a stored procedure that executes our SQL
EXEC_FUNCTION='{"query": "CREATE OR REPLACE FUNCTION create_donor_tables() RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN DROP TABLE IF EXISTS donor_profiles CASCADE; DROP TABLE IF EXISTS donors CASCADE; DROP TYPE IF EXISTS donor_type CASCADE; CREATE TYPE donor_type AS ENUM ('"'"'individual'"'"', '"'"'organization'"'"'); CREATE TABLE donors (id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY, email TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL, phone TEXT, donor_type donor_type DEFAULT '"'"'individual'"'"', email_verified BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP); CREATE TABLE donor_profiles (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE, bio TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, UNIQUE(donor_id)); ALTER TABLE donors ENABLE ROW LEVEL SECURITY; ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY; CREATE POLICY \"Users can insert own donor record\" ON donors FOR INSERT WITH CHECK (auth.uid() = id); CREATE POLICY \"Donors can view own record\" ON donors FOR SELECT USING (auth.uid() = id); CREATE POLICY \"Users can manage own profile\" ON donor_profiles FOR ALL USING (auth.uid() = donor_id); GRANT ALL ON donors TO anon, authenticated; GRANT ALL ON donor_profiles TO anon, authenticated; INSERT INTO donors (id, email, full_name, phone, donor_type) VALUES ('"'"'a6dd2983-3dd4-4e0d-b3f6-17d38772ff32'"'"', '"'"'test@dkdev.io'"'"', '"'"'Test Donor Account'"'"', '"'"'555-0123'"'"', '"'"'individual'"'"') ON CONFLICT DO NOTHING; INSERT INTO donor_profiles (donor_id, bio) VALUES ('"'"'a6dd2983-3dd4-4e0d-b3f6-17d38772ff32'"'"', '"'"'Test donor account'"'"') ON CONFLICT DO NOTHING; RETURN '"'"'Tables created successfully'"'"'; EXCEPTION WHEN OTHERS THEN RETURN '"'"'Error: '"'"' || SQLERRM; END; $$;"}'

# Try to create the function
echo "Creating function..."
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$EXEC_FUNCTION")

echo "Response: $RESPONSE"

# Now try to call the function
echo ""
echo "Calling function to create tables..."
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/create_donor_tables" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{}")

echo "Response: $RESPONSE"

# Test if tables were created
echo ""
echo "Testing tables..."

# Check donors table
echo -n "Checking donors table... "
RESPONSE=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/donors?select=*&limit=1" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

if [[ "$RESPONSE" == *"\"id\""* ]] || [[ "$RESPONSE" == "[]" ]]; then
  echo "✅ EXISTS"
else
  echo "❌ NOT FOUND"
  echo "Response: $RESPONSE"
fi

# Check donor_profiles table  
echo -n "Checking donor_profiles table... "
RESPONSE=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/donor_profiles?select=*&limit=1" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

if [[ "$RESPONSE" == *"\"id\""* ]] || [[ "$RESPONSE" == "[]" ]]; then
  echo "✅ EXISTS"
else
  echo "❌ NOT FOUND"
  echo "Response: $RESPONSE"
fi

echo ""
echo "✨ Done"
