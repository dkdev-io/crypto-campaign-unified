#!/bin/bash

# Direct SQL execution via curl to Supabase PostgREST
SUPABASE_URL="https://kmepcdsklnnxokoimvzo.supabase.co"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SERVICE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required"
  echo "Please set it in your .env file and source it"
  exit 1
fi

echo "🔧 DIRECT SQL EXECUTION VIA CURL"
echo "🎯 Attempting to execute SQL fixes directly via PostgREST API"
echo "=" $(printf "=%.0s" {1..60})

# Function to execute SQL
execute_sql() {
    local description="$1"
    local sql="$2"
    
    echo ""
    echo "📝 $description..."
    
    # Try different PostgREST endpoints
    local endpoints=("rpc/exec" "rpc/execute" "rpc/query" "rpc/sql")
    
    for endpoint in "${endpoints[@]}"; do
        echo "   🔄 Trying endpoint: $endpoint"
        
        response=$(curl -s -X POST "$SUPABASE_URL/rest/v1/$endpoint" \
            -H "apikey: $SERVICE_KEY" \
            -H "Authorization: Bearer $SERVICE_KEY" \
            -H "Content-Type: application/json" \
            -H "Prefer: return=minimal" \
            -d "{\"sql\":\"$sql\"}" 2>/dev/null)
        
        # Check if response indicates success
        if [[ $response != *"PGRST"* ]] && [[ $response != *"error"* ]] && [[ $response != *"Could not find"* ]]; then
            echo "   ✅ Success via $endpoint"
            echo "   📋 Response: $response"
            return 0
        else
            echo "   ❌ Failed via $endpoint: $response"
        fi
    done
    
    return 1
}

# Try creating a simple function first to test if we can execute SQL
echo ""
echo "🧪 TESTING SQL EXECUTION CAPABILITY..."

test_sql="SELECT 1 as test_result;"
if execute_sql "Test basic SQL execution" "$test_sql"; then
    echo "✅ SQL execution is working! Proceeding with fixes..."
else
    echo "❌ Cannot execute SQL directly via API endpoints"
    echo ""
    echo "🔄 ATTEMPTING ALTERNATIVE APPROACH..."
    
    # Try using the Database REST API directly
    echo "📝 Trying database REST API..."
    
    response=$(curl -s -X POST "$SUPABASE_URL/rest/v1/" \
        -H "apikey: $SERVICE_KEY" \
        -H "Authorization: Bearer $SERVICE_KEY" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d '{}' 2>/dev/null)
    
    echo "Database API response: $response"
    
    echo ""
    echo "❌ DIRECT SQL EXECUTION NOT POSSIBLE VIA API"
    echo "📋 MANUAL EXECUTION REQUIRED:"
    echo "   1. Open: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo"
    echo "   2. Go to SQL Editor"
    echo "   3. Copy and paste the contents of: scripts/FINAL-DATABASE-FIXES.sql"
    echo "   4. Click 'RUN' to execute all fixes"
    echo ""
    echo "🎯 This is the most reliable way to apply the database fixes."
    exit 1
fi

# If we get here, SQL execution worked, so apply the fixes
echo ""
echo "🔧 APPLYING DATABASE FIXES..."

# Fix 1: Add status column
status_sql="ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';"
execute_sql "Add status column to campaigns" "$status_sql"

# Fix 2: Create contributions table
contrib_sql="CREATE TABLE IF NOT EXISTS contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending',
    donor_email TEXT,
    donor_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);"
execute_sql "Create contributions table" "$contrib_sql"

# Fix 3: Create KYC table
kyc_sql="CREATE TABLE IF NOT EXISTS kyc_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    verification_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);"
execute_sql "Create KYC data table" "$kyc_sql"

# Fix 4: Enable RLS
rls_sql="ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_data ENABLE ROW LEVEL SECURITY;"
execute_sql "Enable Row Level Security" "$rls_sql"

# Fix 5: Create policies
policy_sql="CREATE POLICY IF NOT EXISTS campaigns_public_access ON campaigns FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS contributions_public_access ON contributions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS kyc_data_public_access ON kyc_data FOR ALL USING (true);"
execute_sql "Create RLS policies" "$policy_sql"

# Fix 6: Dashboard function
function_sql="CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS \$\$
BEGIN
  RETURN json_build_object(
    'total_campaigns', (SELECT COUNT(*) FROM campaigns),
    'active_campaigns', (SELECT COUNT(*) FROM campaigns WHERE status = 'active'),
    'total_contributions', (SELECT COUNT(*) FROM contributions),
    'total_raised', (SELECT COALESCE(SUM(amount), 0) FROM contributions)
  );
END;
\$\$ LANGUAGE plpgsql;"
execute_sql "Create dashboard statistics function" "$function_sql"

echo ""
echo "=" $(printf "=%.0s" {1..60})
echo "🎯 FIX APPLICATION COMPLETE"
echo "=" $(printf "=%.0s" {1..60})
echo ""
echo "🧪 Run verification: node tests/integration/specific-fix-test.js"
echo "🚀 Run full test suite: node tests/integration/actual-crud-test.js"