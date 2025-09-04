# Supabase Email Verification Fix

## Problem

- Missing `VITE_SUPABASE_ANON_KEY` environment variable
- Supabase projects `kmepcdsklnnxokoimvzo` and `owjvgdzmmlrdtpjdxgka` no longer exist
- App uses fallback client that rejects all auth operations

## Solution Steps

### 1. Create New Supabase Project

1. Go to [supabase.com](https://supabase.com/dashboard)
2. Create new project
3. Note the project URL and anon key

### 2. Configure Environment Variables

Create `/frontend/.env` with:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Update Supabase Configuration

Update `/frontend/src/lib/supabase.js` line 4 to use your new project URL:

```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_NEW_PROJECT.supabase.co';
```

### 4. Set Up Database Schema

Run the SQL from `/frontend/src/lib/supabase-setup.js` lines 53-134 in your Supabase SQL editor.

### 5. Configure Email Authentication

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Enable email confirmations
3. Configure SMTP settings or use Supabase's built-in email service
4. Set up email templates under Authentication > Email Templates

### 6. Test Email Verification

1. Restart your development server
2. Try signing up with a valid email
3. Check your email for verification message

## Files That Need URL Updates

After creating your new project, update these files with your new Supabase URL:

- `/frontend/src/lib/supabase.js` (main config)
- Multiple scripts and test files (see grep results for full list)

## Critical: Email Settings

Ensure in your Supabase project dashboard:

- Authentication > Settings > "Enable email confirmations" is ON
- Authentication > Settings > Site URL is set to your domain
- Email templates are configured under Authentication > Email Templates
