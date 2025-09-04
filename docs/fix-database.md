# Database Fix Instructions

## Step 1: Add Missing Column to Supabase

1. Go to https://supabase.com/dashboard
2. Select your project (kmepcdsklnnxokoimvzo)
3. Go to "Table Editor" in the left sidebar
4. Click on the "campaigns" table
5. Click "Add Column" or the "+" button
6. Add these columns:

**Column: candidate_name**

- Name: `candidate_name`
- Type: `text`
- Default value: (leave empty)
- Allow nullable: ✅ Yes

**Optional: Other useful columns**

- `user_id` (text, nullable)
- `status` (text, default: 'draft')

## Step 2: Run the Code Fixes

After adding the database column, the code fixes below will work properly.

## Alternative: SQL Command

If you prefer SQL, go to "SQL Editor" in Supabase and run:

```sql
ALTER TABLE campaigns ADD COLUMN candidate_name TEXT;
ALTER TABLE campaigns ADD COLUMN status TEXT DEFAULT 'draft';
```
