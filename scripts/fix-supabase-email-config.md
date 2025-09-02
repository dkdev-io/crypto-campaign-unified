# Supabase Email Configuration Fix

## Issue Identified
✅ **Signup API calls work correctly** - users are created successfully
❌ **Verification emails not being sent** - email confirmation disabled or SMTP not configured

## Root Cause Analysis
Our test confirmed that:
1. Supabase client connection is working
2. User creation is successful 
3. Users are created with `email_confirmed_at: null` (correct)
4. BUT no verification emails are reaching users

This indicates the Supabase project email configuration needs to be fixed.

## Required Fixes in Supabase Dashboard

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `kmepcdsklnnxokoimvzo`

### Step 2: Check Email Authentication Settings
1. Navigate to **Authentication** → **Settings** 
2. Under **Email Settings**:
   - ✅ Ensure **"Enable email confirmations"** is **TURNED ON**
   - ✅ Ensure **"Enable sign ups"** is **TURNED ON**

### Step 3: Configure Email Provider
You have two options:

#### Option A: Use Supabase Built-in Email (Recommended for testing)
1. In Authentication Settings
2. Under **SMTP Settings**: 
   - Leave blank to use Supabase's default email service
   - This should work for development/testing

#### Option B: Configure Custom SMTP (Production recommended)
1. Set up custom SMTP provider (SendGrid, Mailgun, etc.)
2. Configure SMTP settings in Supabase:
   ```
   SMTP Host: [your-smtp-host]
   SMTP Port: [your-smtp-port]  
   SMTP User: [your-smtp-username]
   SMTP Pass: [your-smtp-password]
   ```

### Step 4: Check Email Templates
1. Go to **Authentication** → **Templates**
2. Verify the **"Confirm Signup"** template is enabled and configured:
   ```html
   Subject: Confirm your signup
   Body: Click this link to confirm: {{ .ConfirmationURL }}
   ```

### Step 5: Verify Redirect URLs  
1. In **Authentication** → **URL Configuration**
2. Add allowed redirect URLs:
   ```
   https://cryptocampaign.netlify.app/auth
   http://localhost:3000/auth
   ```

### Step 6: Test Email Delivery
1. Run our test script again:
   ```bash
   node scripts/test-auth-email-config.js
   ```
2. Check if verification email is received

## Alternative Solution: Custom Email Handling

If Supabase emails continue to fail, we can implement custom email sending:

### Add Email Service to Backend
```javascript
// backend/src/services/emailService.js
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransporter({
  // Your email provider config
})

export async function sendVerificationEmail(email, token) {
  const verificationUrl = `${process.env.APP_URL}/auth?token=${token}&verified=true`
  
  await transporter.sendMail({
    to: email,
    subject: 'Verify your email address',
    html: `
      <h1>Verify Your Email</h1>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationUrl}">Verify Email</a>
    `
  })
}
```

### Update AuthContext to Handle Custom Verification
```javascript
// In signUp function - add custom email sending
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { 
    emailRedirectTo: `${window.location.origin}/auth?verified=true`
  }
})

if (data.user && !error) {
  // Send custom verification email as backup
  try {
    await fetch('/api/send-verification-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: data.user.email,
        userId: data.user.id 
      })
    })
  } catch (emailError) {
    console.warn('Custom email failed, relying on Supabase:', emailError)
  }
}
```

## Priority Actions

1. **Immediate**: Check Supabase Dashboard email settings (Step 2)
2. **If still broken**: Enable built-in Supabase email service (Step 3A) 
3. **Long-term**: Set up custom SMTP for production (Step 3B)
4. **Backup plan**: Implement custom email service if needed

## Testing Commands

```bash
# Test current configuration
node scripts/test-auth-email-config.js

# Test with your actual email
# (Edit the script to use your real email address)
```

## Expected Results After Fix
- ✅ Users receive verification email within 1-2 minutes
- ✅ Email contains clickable verification link
- ✅ Link redirects to `/auth?verified=true` 
- ✅ User can complete login after verification