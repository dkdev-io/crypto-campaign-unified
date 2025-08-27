import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const ProtectedRoute = ({ children, requireVerified = true }) => {
  const { user, loading, isEmailVerified, signOut } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--gradient-section)'
      }}>
        <div style={{ 
          textAlign: 'center',
          padding: '2rem',
          background: 'hsl(var(--crypto-white))',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-card)',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <div style={{ 
            width: '48px', 
            height: '48px',
            border: '4px solid hsl(var(--crypto-light-gray))',
            borderTop: '4px solid hsl(var(--crypto-blue))',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: 'hsl(var(--crypto-medium-gray))' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // No user logged in - redirect to auth page
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  // User logged in but email not verified when verification is required
  if (requireVerified && !isEmailVerified()) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--gradient-section)',
        padding: '2rem'
      }}>
        <div className="container-responsive" style={{ maxWidth: '600px' }}>
          <div style={{ 
            background: 'hsl(var(--crypto-white))',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-card)',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{
              background: 'hsl(var(--crypto-gold) / 0.1)', 
              border: '1px solid hsl(var(--crypto-gold) / 0.3)',
              borderRadius: 'var(--radius)',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <h2 style={{ color: 'hsl(var(--crypto-navy))', marginBottom: '1rem' }}>📧 Email Verification Required</h2>
              <p style={{ color: 'hsl(var(--crypto-medium-gray))', marginBottom: '1rem' }}>
                We sent a verification link to <strong>{user.email}</strong>
              </p>
              <p style={{ color: 'hsl(var(--crypto-medium-gray))', fontSize: 'var(--text-body-sm)' }}>
                Please check your email and click the verification link to continue.
              </p>
            </div>
            
            <div style={{ 
              background: 'hsl(var(--crypto-light-gray))',
              borderRadius: 'var(--radius)',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <h3 style={{ color: 'hsl(var(--crypto-navy))', marginBottom: '1rem', fontSize: 'var(--text-heading-sm)' }}>Next Steps:</h3>
              <ol style={{ color: 'hsl(var(--crypto-medium-gray))', paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Check your email inbox (and spam folder)</li>
                <li style={{ marginBottom: '0.5rem' }}>Click the verification link in the email</li>
                <li style={{ marginBottom: '0.5rem' }}>Return here after verifying your email</li>
              </ol>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn-primary"
                onClick={() => window.location.reload()}
              >
                I've Verified My Email
              </button>
              <button 
                className="btn-secondary"
                onClick={signOut}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // User is authenticated and meets all requirements
  return children
}

export default ProtectedRoute