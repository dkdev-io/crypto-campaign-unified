/**
 * Utility functions for determining correct authentication routes
 * based on user context and current location
 */

/**
 * Determines the appropriate auth route based on current location
 * @param {string} currentPath - Current pathname from useLocation
 * @param {object} state - Optional state to pass to auth route
 * @returns {object} - Object with pathname and state for navigation
 */
export const getAuthRoute = (currentPath, state = {}) => {
  // If we're in a campaign context, use campaign auth
  if (currentPath?.startsWith('/campaigns') || currentPath?.startsWith('/setup')) {
    return {
      pathname: '/campaigns/auth',
      state: { 
        from: currentPath,
        ...state 
      }
    }
  }

  // If we're in a donor context, use donor auth
  if (currentPath?.startsWith('/donors')) {
    return {
      pathname: '/donors/auth',
      state: { 
        from: currentPath,
        ...state 
      }
    }
  }

  // If we're in an admin context, use admin auth
  if (currentPath?.startsWith('/admin')) {
    return {
      pathname: '/admin/login',
      state: { 
        from: currentPath,
        ...state 
      }
    }
  }

  // For the home page or unknown contexts, check referrer or default to campaigns
  // This handles cases where users land on the root page and need auth
  const referrer = document.referrer
  if (referrer?.includes('/donors')) {
    return {
      pathname: '/donors/auth',
      state: { 
        from: currentPath,
        ...state 
      }
    }
  }

  // Default to campaign auth for root, about, or other general pages
  // since campaigns are the primary use case
  return {
    pathname: '/campaigns/auth',
    state: { 
      from: currentPath,
      ...state 
    }
  }
}

/**
 * Determines auth context from various indicators
 * @param {string} currentPath - Current pathname
 * @param {object} user - Current user object (if any)
 * @returns {string} - 'campaign', 'donor', 'admin', or 'default'
 */
export const getAuthContext = (currentPath, user = null) => {
  // Check URL path first
  if (currentPath?.startsWith('/campaigns') || currentPath?.startsWith('/setup')) {
    return 'campaign'
  }
  
  if (currentPath?.startsWith('/donors')) {
    return 'donor'
  }
  
  if (currentPath?.startsWith('/admin')) {
    return 'admin'
  }

  // Check user type if available
  if (user) {
    if (user.user_metadata?.role === 'admin') {
      return 'admin'
    }
    if (user.app_metadata?.isDonor) {
      return 'donor'
    }
    // Default user type is campaign
    return 'campaign'
  }

  // Default context for unauthenticated users
  return 'campaign'
}