# Test Email Policy

## CRITICAL: APPROVED TEST EMAIL ONLY

**ALL Puppeteer and automated tests MUST use the following email address:**

```
test@dkdev.io
```

## DO NOT USE:

- ❌ Fake emails with timestamps (e.g., `test-${Date.now()}@example.com`)
- ❌ Random email generators
- ❌ Faker library for emails
- ❌ Any @test.com, @example.com, @gmail.com test addresses
- ❌ Any dynamically generated email addresses

## WHY THIS MATTERS:

Using multiple fake emails causes problems with Supabase authentication and email verification systems. The approved email `test@dkdev.io` is configured and whitelisted for testing purposes.

## ENFORCEMENT:

All test files will be audited to ensure compliance with this policy. Any tests using non-approved emails will fail code review.

## FOR DEVELOPERS:

When writing new tests, always use:

```javascript
const testEmail = 'test@dkdev.io';
```

Never use:

```javascript
// ❌ WRONG
const testEmail = `test-${Date.now()}@example.com`;
const testEmail = faker.internet.email();
const testEmail = `user${Math.random()}@test.com`;
```

## Questions?

Contact the development team if you need clarification on test email usage.
