# Manual Account Verification Instructions

## ⚠️ IMPORTANT: Email verification has been bypassed in the frontend for testing

The frontend AuthContext has been updated to bypass email verification checks. This allows you to test while Supabase email verification is being fixed.

## Steps to Manually Verify Accounts in Supabase Dashboard:

1. **Go to your Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run these SQL commands in order:**

```sql
-- STEP 1: Check all existing users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- STEP 2: Manually verify ALL accounts (mark them as email confirmed)
UPDATE auth.users
SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- STEP 3: Verify the update worked
SELECT 
    id,
    email,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Verified'
        ELSE '❌ Not Verified'
    END as status
FROM auth.users
ORDER BY created_at DESC;
```

## Testing Your Accounts

After running the SQL above, you can now:

1. **Sign in with any existing account** - The email verification check has been bypassed in the frontend
2. **Create new accounts** - They will work immediately without email verification
3. **Test campaign creation** - Campaign accounts can now access the full dashboard
4. **Test donor functions** - Donor accounts can make donations

## Files Modified for Testing:

- `/frontend/src/contexts/AuthContext.jsx` - `isEmailVerified()` now returns `true` (line 304-310)
- Created `/scripts/manual-verify-sql.sql` - SQL commands for manual verification
- Created `/scripts/direct-db-verify.js` - Node.js script to check accounts
- Created this file: `/VERIFY_ACCOUNTS_SQL.md` - Instructions

## To Restore Normal Email Verification:

When Supabase email verification is fixed, remove the bypass by:

1. Edit `/frontend/src/contexts/AuthContext.jsx`
2. In the `isEmailVerified()` function (around line 304-310)
3. Change from:
   ```javascript
   return true // Always return true for now
   ```
4. Back to:
   ```javascript
   return user?.email_confirmed_at !== null
   ```

## Current Status:

✅ Frontend bypassed for testing
✅ SQL commands prepared for manual verification
✅ You can now test the app without email verification blocking you

Run the SQL commands above in your Supabase dashboard to manually verify any existing accounts!