#!/bin/bash

# Load environment variables
source .env

# Supabase project details
SUPABASE_URL="https://owjvgdzmmlrdtpjdxgka.supabase.co"
SERVICE_KEY="$MIGRATION_SUPABASE_SERVICE_KEY"

if [ -z "$SERVICE_KEY" ]; then
    echo "❌ Missing MIGRATION_SUPABASE_SERVICE_KEY in .env"
    exit 1
fi

echo "🚀 Creating donor tables via Supabase REST API..."
echo ""

# Create a SQL function that we can call via RPC
CREATE_FUNCTION_SQL='CREATE OR REPLACE FUNCTION create_donor_tables()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Drop existing tables
  DROP TABLE IF EXISTS donor_tax_receipts CASCADE;
  DROP TABLE IF EXISTS donor_saved_campaigns CASCADE;
  DROP TABLE IF EXISTS donations CASCADE;
  DROP TABLE IF EXISTS donor_profiles CASCADE;
  DROP TABLE IF EXISTS donors CASCADE;
  DROP TYPE IF EXISTS donor_type CASCADE;
  DROP TYPE IF EXISTS donation_status CASCADE;

  -- Create types
  CREATE TYPE donor_type AS ENUM ('"'"'individual'"'"', '"'"'organization'"'"');
  CREATE TYPE donation_status AS ENUM ('"'"'pending'"'"', '"'"'completed'"'"', '"'"'failed'"'"', '"'"'refunded'"'"');

  -- Create donors table
  CREATE TABLE donors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    donor_type donor_type NOT NULL DEFAULT '"'"'individual'"'"'
  );

  -- Create donor_profiles table
  CREATE TABLE donor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    bio TEXT,
    interests TEXT[],
    donation_preferences JSONB DEFAULT '"'"'{}'"'"',
    tax_id TEXT,
    preferred_payment_methods TEXT[],
    notification_preferences JSONB DEFAULT '"'"'{"email": true, "sms": false, "push": false}'"'"',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(donor_id)
  );

  -- Create campaigns if not exists
  CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create donations table
  CREATE TABLE donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT '"'"'USD'"'"',
    crypto_currency TEXT,
    transaction_hash TEXT,
    status donation_status NOT NULL DEFAULT '"'"'pending'"'"',
    donation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_anonymous BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '"'"'{}'"'"',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create donor_saved_campaigns table
  CREATE TABLE donor_saved_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(donor_id, campaign_id)
  );

  -- Create donor_tax_receipts table
  CREATE TABLE donor_tax_receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    receipt_number TEXT UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    tax_year INTEGER NOT NULL,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(donation_id)
  );

  -- Enable RLS
  ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
  ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE donor_saved_campaigns ENABLE ROW LEVEL SECURITY;
  ALTER TABLE donor_tax_receipts ENABLE ROW LEVEL SECURITY;

  -- Create basic policies
  CREATE POLICY "Enable insert for registration" ON donors FOR INSERT WITH CHECK (true);
  CREATE POLICY "Donors can view own record" ON donors FOR SELECT USING (auth.uid() = id);
  CREATE POLICY "Donors can update own record" ON donors FOR UPDATE USING (auth.uid() = id);
  CREATE POLICY "Donors can insert own profile" ON donor_profiles FOR INSERT WITH CHECK (true);
  CREATE POLICY "Donors can view own profile" ON donor_profiles FOR SELECT USING (donor_id = auth.uid());
  CREATE POLICY "Donors can view own donations" ON donations FOR SELECT USING (donor_id = auth.uid());
  CREATE POLICY "Enable donation insertion" ON donations FOR INSERT WITH CHECK (true);

  RETURN '"'"'Tables created successfully'"'"';
EXCEPTION
  WHEN OTHERS THEN
    RETURN '"'"'Error: '"'"' || SQLERRM;
END;
$$;'

# Try to create the function first
echo "Creating SQL function..."
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${CREATE_FUNCTION_SQL}\"}")

echo "Function creation response: $RESPONSE"
echo ""

# Now try to call the function
echo "Calling function to create tables..."
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/create_donor_tables" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{}")

echo "Table creation response: $RESPONSE"
echo ""

# Test if tables exist
echo "Testing if tables were created..."
for TABLE in donors donor_profiles donations; do
  echo -n "Checking $TABLE table... "
  RESPONSE=$(curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/${TABLE}?limit=1" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}")
  
  if [[ "$RESPONSE" == *"does not exist"* ]]; then
    echo "❌ Not found"
  elif [[ "$RESPONSE" == "[]" ]] || [[ "$RESPONSE" == *"\"id\""* ]]; then
    echo "✅ Exists!"
  else
    echo "⚠️  Unclear: $RESPONSE"
  fi
done

echo ""
echo "✨ Done"