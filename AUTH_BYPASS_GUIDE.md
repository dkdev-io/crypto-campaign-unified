# Development Authentication Bypass Guide

## Overview

This development-only authentication bypass allows you to skip the authentication flow during development and automatically be logged in as a test user account.

## ⚠️ IMPORTANT SECURITY NOTES

- **ONLY for development environments**
- **NEVER enable in production** - The system will throw errors if you try
- **Always set VITE_SKIP_AUTH=false before deploying**
- The bypass includes multiple safety checks to prevent production use

## How to Enable/Disable

### Enable the Bypass

1. Edit `frontend/.env`
2. Change `VITE_SKIP_AUTH=false` to `VITE_SKIP_AUTH=true`
3. Restart your development server (`npm run dev`)

### Disable the Bypass

1. Edit `frontend/.env`
2. Change `VITE_SKIP_AUTH=true` to `VITE_SKIP_AUTH=false`
3. Restart your development server

## Test User Details

When bypass is active, you'll be automatically authenticated as:

- **Email**: test@dkdev.io
- **Full Name**: Test User (Bypass)
- **Role**: admin
- **User ID**: test-user-bypass-id
- **Email Verified**: true

## What Gets Bypassed

- All sign up flows
- All sign in flows
- Email verification requirements
- Password requirements
- Session management
- Authentication redirects

## Console Warnings

When bypass is active, you'll see warning messages in the browser console:

```
🚨 DEVELOPMENT AUTH BYPASS IS ACTIVE
🚨 All authentication is bypassed!
🚨 Authenticated as: test@dkdev.io
```

## Usage Examples

### For Frontend Development

```bash
# Enable bypass
echo "VITE_SKIP_AUTH=true" >> frontend/.env

# Start dev server
npm run dev

# You'll be automatically logged in as test@dkdev.io
```

### For Testing Protected Routes

With bypass enabled, all protected routes will work immediately without requiring login:

- `/dashboard`
- `/admin/*`
- Any component using `<ProtectedRoute>`

### For API Testing

The test user session includes:

- Access token: `bypass-access-token`
- Session data with proper Supabase format
- All required user metadata

## Production Safety

The system includes multiple safeguards:

1. **Environment Check**: Only works when `NODE_ENV=development` or `DEV=true`
2. **Error Throwing**: Will throw errors if bypass is enabled in production
3. **Console Warnings**: Clear warnings when bypass is active
4. **Default Disabled**: VITE_SKIP_AUTH defaults to `false`

## How to Find Real User IDs

When you need to work with real user data, use this script:

```javascript
import { supabase } from './src/lib/supabase.js';

// Find user by email
const findUser = async (email) => {
  const { data, error } = await supabase.auth.getUser();
  console.log('Current user:', data?.user);

  // Or query auth.users (requires service role key)
  // const { data: users } = await supabase.auth.admin.listUsers()
  // console.log('All users:', users)
};

findUser('test@dkdev.io');
```

## Troubleshooting

### Bypass Not Working

1. Check `frontend/.env` has `VITE_SKIP_AUTH=true`
2. Restart the development server
3. Check browser console for warning messages

### Still Seeing Login Pages

1. Clear browser cache/localStorage
2. Check that you're in development mode
3. Verify environment variables loaded correctly

### Production Errors

If you see errors about "AUTH BYPASS ENABLED IN PRODUCTION":

1. Set `VITE_SKIP_AUTH=false`
2. Rebuild your application
3. Redeploy

## Implementation Details

The bypass is implemented across all auth contexts:

- `frontend/src/contexts/AuthContext.jsx` - Main auth bypass logic
- `frontend/src/contexts/DonorAuthContext.jsx` - Donor-specific auth bypass
- `frontend/src/contexts/AdminContext.jsx` - Admin auth bypass
- `frontend/.env` - Configuration variable (`VITE_SKIP_AUTH`)
- Multiple safety checks throughout all auth flows

### Auth Contexts Covered

1. **Main AuthContext**: Primary authentication system
2. **DonorAuthContext**: Donor-specific authentication flow
3. **AdminContext**: Admin panel authentication system

Each context gets a tailored test user:

- **Main Auth**: `Test User (Bypass)` with admin role
- **Donor Auth**: `Test Donor (Bypass)` with complete donor profile
- **Admin Auth**: `Test Admin (Bypass)` with super_admin permissions

## Quick Commands

```bash
# Check current status
node toggle-auth-bypass.js status

# Enable bypass
node toggle-auth-bypass.js on

# Disable bypass
node toggle-auth-bypass.js off

# Verify implementation
node verify-auth-bypass-complete.js
```

The bypass creates mock user sessions that match each system's expected format, allowing all auth-dependent features to work normally across the entire application.
