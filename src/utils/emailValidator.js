/**
 * Email Validation Utility
 * Prevents invalid emails from being sent to Supabase
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Domains that should not receive actual emails in development
const BLOCKED_DEV_DOMAINS = [
  'example.com',
  'test.com',
  'livetest.com',
  'tempmail.com',
  'guerrillamail.com'
];

/**
 * Validates email format and domain
 * @param {string} email 
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // Basic format validation
  if (!EMAIL_REGEX.test(email)) return false;
  
  // Check for blocked domains in development
  if (process.env.NODE_ENV === 'development') {
    const domain = email.split('@')[1]?.toLowerCase();
    if (BLOCKED_DEV_DOMAINS.includes(domain)) {
      console.warn(`⚠️ Blocked email domain in development: ${domain}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Sanitizes email for development use
 * @param {string} email 
 * @returns {string}
 */
export function sanitizeEmailForDev(email) {
  if (!email) return '';
  
  const [localPart, domain] = email.split('@');
  
  // Replace problematic domains with safe ones
  if (BLOCKED_DEV_DOMAINS.includes(domain?.toLowerCase())) {
    return `${localPart}@dev.local`;
  }
  
  return email;
}

/**
 * Checks if email domain is likely to bounce
 * @param {string} email 
 * @returns {boolean}
 */
export function isLikelyToBounce(email) {
  if (!email) return true;
  
  const domain = email.split('@')[1]?.toLowerCase();
  return BLOCKED_DEV_DOMAINS.includes(domain);
}
