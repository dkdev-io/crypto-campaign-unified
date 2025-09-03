-- Fix Email Bounce Issues
-- Update auth configuration to prevent email bounces

-- Update email rate limit to be more conservative
UPDATE auth.config SET value = '{"per_hour": 1}' WHERE name = 'RATE_LIMIT_EMAIL_SENT';

-- Clean up any remaining problematic email domains in user data
UPDATE auth.users 
SET email = REPLACE(email, '@example.com', '@dkdev.io')
WHERE email LIKE '%@example.com';

UPDATE auth.users 
SET email = REPLACE(email, '@test.com', '@dev.local')  
WHERE email LIKE '%@test.com';

UPDATE auth.users 
SET email = REPLACE(email, '@livetest.com', '@localhost.local')
WHERE email LIKE '%@livetest.com';

-- Add email domain validation function
CREATE OR REPLACE FUNCTION validate_email_domain(email_input text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    domain text;
    blocked_domains text[] := ARRAY['example.com', 'test.com', 'livetest.com', 'tempmail.com'];
BEGIN
    -- Extract domain from email
    domain := split_part(email_input, '@', 2);
    
    -- Check if domain is in blocked list
    IF domain = ANY(blocked_domains) THEN
        RETURN false;
    END IF;
    
    -- Basic email format validation
    IF email_input !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;