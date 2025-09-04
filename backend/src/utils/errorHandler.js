/**
 * Error handling utilities for website style analysis
 * Provides structured error handling and user-friendly error messages
 */

class WebsiteAnalysisError extends Error {
  constructor(message, code, url, originalError = null) {
    super(message);
    this.name = 'WebsiteAnalysisError';
    this.code = code;
    this.url = url;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    this.userFriendly = true;
  }
}

/**
 * Error codes and their user-friendly messages
 */
const ERROR_CODES = {
  // Network and access errors
  NETWORK_ERROR: {
    message: 'Unable to connect to the website. Please check the URL and try again.',
    suggestions: [
      'Verify the website URL is correct',
      'Check if the website is online',
      'Try again in a few moments',
    ],
  },
  TIMEOUT: {
    message: 'The website took too long to respond. This might be a slow site.',
    suggestions: [
      'Try a different page from the same website',
      'Wait a moment and try again',
      'Check if the website is working in your browser',
    ],
  },
  ACCESS_DENIED: {
    message: 'The website blocked our analysis. Some sites restrict automated access.',
    suggestions: [
      'Try the main homepage URL instead of a specific page',
      'Check if the site has a robots.txt that might block crawlers',
      'Contact support if this is your own website',
    ],
  },
  NOT_FOUND: {
    message: 'The webpage was not found. Please check the URL.',
    suggestions: [
      'Verify the URL is spelled correctly',
      'Try the main website homepage',
      'Check if the page exists in your browser',
    ],
  },
  INVALID_URL: {
    message: 'The URL format is invalid. Please enter a valid website URL.',
    suggestions: [
      'Include http:// or https://',
      'Use the full website address',
      'Example: https://yoursite.com',
    ],
  },

  // Content and parsing errors
  NO_CONTENT: {
    message: 'The website appears to be empty or has no visible content to analyze.',
    suggestions: [
      'Try a different page with more content',
      'Make sure the website has loaded completely',
      'Check if the site requires JavaScript to load content',
    ],
  },
  PARSING_ERROR: {
    message: 'We had trouble analyzing the website content. The site may use unusual formatting.',
    suggestions: [
      'Try analyzing the main homepage',
      'Check if the site loads properly in your browser',
      'Some sites with heavy JavaScript may not work well',
    ],
  },
  NO_STYLES: {
    message: "We couldn't find any useful colors or fonts to extract from this website.",
    suggestions: [
      'Try a page with more visual content',
      'Make sure the site has loaded completely',
      'Some minimal sites may not have extractable styles',
    ],
  },

  // Technical errors
  BROWSER_ERROR: {
    message: 'Our analysis tool encountered a technical issue. Please try again.',
    suggestions: [
      'Wait a moment and try again',
      'Try a different URL from the same site',
      'Contact support if this keeps happening',
    ],
  },
  MEMORY_ERROR: {
    message: 'The website is too complex to analyze right now. Please try a simpler page.',
    suggestions: [
      'Try the main homepage instead',
      'Try a page with less content',
      'Contact support for help with complex sites',
    ],
  },
  SECURITY_ERROR: {
    message: 'Security restrictions prevented us from analyzing this website.',
    suggestions: [
      'Make sure this is a public website',
      'Try the main homepage URL',
      'Some secure sites may not be analyzable',
    ],
  },

  // Service errors
  RATE_LIMITED: {
    message: 'Too many analysis requests. Please wait a moment before trying again.',
    suggestions: [
      'Wait 15 minutes before your next analysis',
      'Consider analyzing fewer websites',
      'Contact support for higher limits',
    ],
  },
  SERVICE_UNAVAILABLE: {
    message: 'Our analysis service is temporarily unavailable. Please try again later.',
    suggestions: [
      'Try again in a few minutes',
      'Check our status page for updates',
      'Contact support if the issue persists',
    ],
  },
  UNKNOWN: {
    message: 'An unexpected error occurred during analysis. Please try again.',
    suggestions: [
      'Try a different website URL',
      'Wait a moment and retry',
      'Contact support if this keeps happening',
    ],
  },
};

/**
 * Convert technical errors into user-friendly errors
 */
function createUserFriendlyError(originalError, url) {
  let errorCode = 'UNKNOWN';
  let errorMessage = originalError.message || 'Unknown error';

  // Network and connection errors
  if (
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('net::ERR_')
  ) {
    errorCode = 'NETWORK_ERROR';
  }

  // Timeout errors
  else if (errorMessage.includes('timeout') || errorMessage.includes('Navigation timeout')) {
    errorCode = 'TIMEOUT';
  }

  // Access denied / blocked
  else if (
    errorMessage.includes('403') ||
    errorMessage.includes('blocked') ||
    errorMessage.includes('Access denied')
  ) {
    errorCode = 'ACCESS_DENIED';
  }

  // Not found errors
  else if (errorMessage.includes('404') || errorMessage.includes('Not found')) {
    errorCode = 'NOT_FOUND';
  }

  // Invalid URL
  else if (errorMessage.includes('Invalid URL') || errorMessage.includes('ERR_INVALID_URL')) {
    errorCode = 'INVALID_URL';
  }

  // Content issues
  else if (errorMessage.includes('No content') || errorMessage.includes('empty')) {
    errorCode = 'NO_CONTENT';
  }

  // Browser/parsing errors
  else if (
    errorMessage.includes('Browser') ||
    errorMessage.includes('Chromium') ||
    errorMessage.includes('Page crashed')
  ) {
    errorCode = 'BROWSER_ERROR';
  }

  // Memory errors
  else if (errorMessage.includes('memory') || errorMessage.includes('ENOMEM')) {
    errorCode = 'MEMORY_ERROR';
  }

  // Security errors
  else if (
    errorMessage.includes('security') ||
    errorMessage.includes('CORS') ||
    errorMessage.includes('SSL')
  ) {
    errorCode = 'SECURITY_ERROR';
  }

  // Rate limiting
  else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    errorCode = 'RATE_LIMITED';
  }

  const errorInfo = ERROR_CODES[errorCode];

  return new WebsiteAnalysisError(errorInfo.message, errorCode, url, originalError);
}

/**
 * Handle errors during website analysis
 */
function handleAnalysisError(error, url, context = {}) {
  console.error('🔥 Website analysis error:', {
    url,
    error: error.message,
    stack: error.stack,
    context,
  });

  // If it's already a user-friendly error, return it
  if (error instanceof WebsiteAnalysisError) {
    return error;
  }

  // Convert technical error to user-friendly error
  return createUserFriendlyError(error, url);
}

/**
 * Generate error response for API
 */
function createErrorResponse(error, url, includeDebugInfo = false) {
  const isUserFriendly = error instanceof WebsiteAnalysisError;
  const errorCode = isUserFriendly ? error.code : 'UNKNOWN';
  const errorInfo = ERROR_CODES[errorCode] || ERROR_CODES.UNKNOWN;

  const response = {
    error: isUserFriendly ? error.message : errorInfo.message,
    code: errorCode,
    url,
    timestamp: new Date().toISOString(),
    suggestions: errorInfo.suggestions,
    userFriendly: isUserFriendly,
  };

  // Add debug info in development
  if (includeDebugInfo && process.env.NODE_ENV !== 'production') {
    response.debug = {
      originalMessage: error.message,
      stack: error.stack,
      name: error.name,
    };
  }

  return response;
}

/**
 * Check if URL is potentially problematic
 */
function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new WebsiteAnalysisError(ERROR_CODES.INVALID_URL.message, 'INVALID_URL', url);
  }

  // Remove whitespace
  url = url.trim();

  // Check for obvious issues
  if (url.length < 4) {
    throw new WebsiteAnalysisError(ERROR_CODES.INVALID_URL.message, 'INVALID_URL', url);
  }

  // Check for localhost (usually not useful for style matching)
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    throw new WebsiteAnalysisError(
      'Localhost URLs cannot be analyzed. Please use a public website URL.',
      'INVALID_URL',
      url
    );
  }

  // Check for file:// URLs
  if (url.startsWith('file://')) {
    throw new WebsiteAnalysisError(
      'Local files cannot be analyzed. Please use a website URL.',
      'INVALID_URL',
      url
    );
  }

  // Known problematic domains
  const problematicDomains = [
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'linkedin.com',
    'amazon.com', // Often blocks crawlers
  ];

  const domain = extractDomain(url);
  if (problematicDomains.some((d) => domain.includes(d))) {
    throw new WebsiteAnalysisError(
      `${domain} typically blocks automated analysis. Try a different website.`,
      'ACCESS_DENIED',
      url
    );
  }

  return url;
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Retry logic for transient errors
 */
async function retryOperation(operation, maxRetries = 2, delay = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry certain errors
      if (error instanceof WebsiteAnalysisError) {
        const noRetryErrors = ['INVALID_URL', 'ACCESS_DENIED', 'NOT_FOUND', 'RATE_LIMITED'];
        if (noRetryErrors.includes(error.code)) {
          throw error;
        }
      }

      // Wait before retrying
      if (attempt < maxRetries) {
        console.log(
          `🔄 Retrying operation (attempt ${attempt + 2}/${maxRetries + 1}) in ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      }
    }
  }

  throw lastError;
}

/**
 * Log error for monitoring and debugging
 */
async function logError(error, url, context = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      name: error.name,
      code: error.code || 'UNKNOWN',
      stack: error.stack,
    },
    url,
    context,
    userAgent: context.userAgent || 'unknown',
    ip: context.ip || 'unknown',
  };

  // Log to console
  console.error('🚨 Website Analysis Error:', logData);

  // In production, you might want to send to external logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service like DataDog, Sentry, etc.
    // await sendToLoggingService(logData);
  }
}

module.exports = {
  WebsiteAnalysisError,
  ERROR_CODES,
  createUserFriendlyError,
  handleAnalysisError,
  createErrorResponse,
  validateUrl,
  extractDomain,
  retryOperation,
  logError,
};
