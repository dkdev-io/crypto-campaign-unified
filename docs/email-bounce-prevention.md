# Email Bounce Prevention Guide

## Overview

This project implements email bounce prevention measures to maintain good deliverability with Supabase and avoid email sending restrictions.

## Key Changes Made

### 1. Test Email Domains Fixed

- Replaced `@example.com` with `@dkdev.io`
- Replaced `@test.com` with `@dev.local`
- Replaced `@livetest.com` with `@localhost.local`

### 2. Email Validation Utility

Created `src/utils/emailValidator.js` with:

- Format validation using proper regex
- Development domain blocking
- Email sanitization for testing
- Bounce risk detection

### 3. Supabase Configuration Updates

- Reduced email rate limit to 1 per hour (was 2)
- Prepared SMTP configuration for custom provider
- Updated admin email to use valid domain

### 4. Environment Configuration

- Added email validation environment variables
- Configured development-safe email settings
- Prepared for custom SMTP provider integration

## Usage

### Email Validation in Code

```javascript
import { isValidEmail, sanitizeEmailForDev } from '../utils/emailValidator.js';

// Before sending emails
if (!isValidEmail(email)) {
  throw new Error('Invalid email address');
}

// In development, sanitize test emails
const safeEmail = sanitizeEmailForDev(email);
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your actual values
```

## Custom SMTP Provider Setup

### Recommended Providers

1. **SendGrid** - Reliable, good deliverability
2. **Mailgun** - Developer-friendly
3. **Amazon SES** - Cost-effective
4. **Postmark** - High deliverability

### Configuration Steps

1. Sign up with email provider
2. Get API credentials
3. Update `.env` with credentials
4. Enable SMTP in `supabase/config.toml`
5. Test with non-bouncing email

## Testing Best Practices

### Development Testing

- Use `@dev.local` for form testing
- Use `@localhost.local` for integration tests
- Never use `@example.com` domains
- Validate emails before Supabase calls

### Production Testing

- Use dedicated test email addresses you control
- Set up email forwarding for test accounts
- Monitor bounce rates in provider dashboard
- Use email verification in signup flow

## Monitoring

### Check Email Health

```bash
# Monitor for problematic domains
grep -r "@example\.com\|@test\.com" . --include="*.js"

# Validate all email constants
node -e "
const validator = require('./src/utils/emailValidator.js');
// Check specific emails
console.log(validator.isValidEmail('test@example.com')); // false
console.log(validator.isValidEmail('test@dkdev.io')); // true
"
```

### Supabase Dashboard

- Monitor email sending in Supabase dashboard
- Check bounce rates and delivery metrics
- Set up alerts for high bounce rates

## Emergency Fixes

If email sending is restricted:

1. **Immediate**: Stop all automated email testing
2. **Audit**: Run email validation across codebase
3. **Replace**: Update any remaining invalid emails
4. **Configure**: Set up custom SMTP provider
5. **Test**: Verify with small batch of valid emails
6. **Monitor**: Watch bounce rates closely

## Contact

For issues with this email configuration, check:

- Supabase project dashboard for email metrics
- Email provider dashboard for delivery stats
- This documentation for troubleshooting steps
