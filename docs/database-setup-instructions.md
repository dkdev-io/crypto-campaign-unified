# Database Setup Instructions

## Apply the Enhanced Contribution Schema

The enhanced donation system requires additional database tables to track contributions, recurring payments, and FEC limits.

### Method 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to your project
3. Go to **SQL Editor**
4. Copy and paste the entire contents of `docs/supabase-contributions-schema.sql`
5. Click **Run** to execute the schema

### Method 2: Via psql (Command Line)

If you have PostgreSQL client installed:

```bash
# Set your database URL (get from Supabase Settings > Database)
export SUPABASE_DB_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Apply the schema
psql "$SUPABASE_DB_URL" -f docs/supabase-contributions-schema.sql
```

## What Gets Created

### New Tables:

- `contributions` - Main contribution tracking with FEC compliance fields
- `recurring_payments` - Individual payments for recurring donations
- `contribution_limits` - Per-donor cumulative limit tracking

### New Features:

- Transaction code generation (`TXN-XXXXXXXX-XXXX` format)
- Automatic recurring payment projection calculations
- FEC $3,300 limit enforcement
- Full audit trail with timestamps
- Row Level Security policies

### New Functions:

- `generate_transaction_code()` - Creates unique transaction codes
- `calculate_recurring_projection()` - Projects recurring donation totals
- `update_updated_at_column()` - Auto-updates timestamps

## Testing the Enhanced Form

After applying the schema:

1. **Visit a campaign:** `http://localhost:5173/?campaign=YOUR_CAMPAIGN_ID`
2. **Test donation types:**
   - One-time donations
   - Recurring donations (with frequency selection)
   - Scheduled donations (future date)
3. **Test FEC compliance:** All checkboxes must be confirmed
4. **Test limits:** Try exceeding $3,300 to see auto-cancellation
5. **Check transaction codes:** Each contribution gets unique TXN code

## Verification

After applying the schema, you should see:

- All new tables in your Supabase Database tab
- Functions listed in Database > Functions
- Policies listed in Authentication > Policies

The enhanced donation form will now fully track all contribution types with FEC compliance!
