import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthRoute } from '../../utils/authRouting';

const ProtectedRoute = ({ children, requireVerified = true }) => {
  const { user, loading, isEmailVerified, signOut } = useAuth();
  const location = useLocation();

  // Check for development bypass - use same system as DonorProtectedRoute
  const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';
  const IS_DEVELOPMENT = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';
  
  // Also support legacy URL parameter bypass
  const searchParams = new URLSearchParams(location.search);
  const bypassParam = searchParams.get('bypass');
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('netlify.app');
  
  const shouldBypass = (SKIP_AUTH && IS_DEVELOPMENT) || (isDevelopment && bypassParam === 'true');
  
  // Debug logging
  console.log('🔍 CAMPAIGN PROTECTED ROUTE DEBUG:');
  console.log('- URL:', location.pathname + location.search);
  console.log('- VITE_SKIP_AUTH:', SKIP_AUTH);
  console.log('- IS_DEVELOPMENT:', IS_DEVELOPMENT);
  console.log('- bypassParam:', bypassParam);
  console.log('- isDevelopment:', isDevelopment);
  console.log('- shouldBypass:', shouldBypass);
  console.log('- user:', !!user);
  console.log('- loading:', loading);

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--gradient-section)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'hsl(var(--crypto-white))',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-card)',
            maxWidth: '400px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid hsl(var(--crypto-light-gray))',
              borderTop: '4px solid hsl(var(--crypto-blue))',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: 'hsl(var(--crypto-medium-gray))' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // No user logged in - redirect to appropriate auth page based on context (unless bypassed)
  if (!user && !shouldBypass) {
    const authRoute = getAuthRoute(location.pathname, { from: location });
    return <Navigate to={authRoute.pathname} state={authRoute.state} replace />;
  }

  // User logged in but email not verified when verification is required (unless bypassed)
  if (requireVerified && !isEmailVerified() && !shouldBypass) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--gradient-section)',
          padding: '2rem',
        }}
      >
        <div className="container-responsive" style={{ maxWidth: '600px' }}>
          <div
            style={{
              background: 'hsl(var(--crypto-white))',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-card)',
              padding: '3rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                background: 'hsl(var(--crypto-gold) / 0.1)',
                border: '1px solid hsl(var(--crypto-gold) / 0.3)',
                borderRadius: 'var(--radius)',
                padding: '2rem',
                marginBottom: '2rem',
              }}
            >
              <h2 style={{ color: 'hsl(var(--crypto-navy))', marginBottom: '1rem' }}>
                📧 Email Verification Required
              </h2>
              <p style={{ color: 'hsl(var(--crypto-medium-gray))', marginBottom: '1rem' }}>
                We sent a verification link to <strong>{user.email}</strong>
              </p>
              <p
                style={{ color: 'hsl(var(--crypto-medium-gray))', fontSize: 'var(--text-body-sm)' }}
              >
                Please check your email and click the verification link to continue.
              </p>
            </div>

            <div
              style={{
                background: 'hsl(var(--crypto-light-gray))',
                borderRadius: 'var(--radius)',
                padding: '1.5rem',
                marginBottom: '2rem',
                textAlign: 'left',
              }}
            >
              <h3
                style={{
                  color: 'hsl(var(--crypto-navy))',
                  marginBottom: '1rem',
                  fontSize: 'var(--text-heading-sm)',
                }}
              >
                Next Steps:
              </h3>
              <ol style={{ color: 'hsl(var(--crypto-medium-gray))', paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Check your email inbox (and spam folder)</li>
                <li style={{ marginBottom: '0.5rem' }}>Click the verification link in the email</li>
                <li style={{ marginBottom: '0.5rem' }}>Return here after verifying your email</li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => window.location.reload()}>
                I've Verified My Email
              </button>
              <button className="btn-secondary" onClick={signOut}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (shouldBypass) {
    console.log('🚨 CAMPAIGN PROTECTED ROUTE BYPASS ACTIVE');
  }

  // User is authenticated and meets all requirements (or bypassed)
  return children;
};

export default ProtectedRoute;
