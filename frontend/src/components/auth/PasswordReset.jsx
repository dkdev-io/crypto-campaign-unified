import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const PasswordReset = ({ onBackToLogin }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const isResetMode = location.pathname.includes('reset-password')
  
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { resetPassword, updatePassword } = useAuth()

  const handleRequestReset = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        if (error.message.includes('not found')) {
          setError('No account found with this email address')
        } else if (error.message.includes('rate limit')) {
          setError('Too many reset attempts. Please wait a moment and try again.')
        } else {
          setError('Failed to send reset email. Please try again.')
        }
        return
      }

      setEmailSent(true)
      setSuccess('Password reset link sent! Check your email.')
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    
    if (!newPassword) {
      setError('Please enter a new password')
      return
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await updatePassword(newPassword)
      
      if (error) {
        if (error.message.includes('expired')) {
          setError('Reset link has expired. Please request a new one.')
        } else {
          setError('Failed to update password. Please try again.')
        }
        return
      }

      setSuccess('Password updated successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/auth')
      }, 2000)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // If user accessed the reset password page from email link
  if (isResetMode) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>🔑 Reset Your Password</h2>
            <p>Enter your new password below</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="auth-form">
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input"
                placeholder="Enter new password"
                required
                minLength={8}
                autoFocus
              />
              <small className="field-help">Must be at least 8 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Confirm new password"
                required
              />
            </div>

            {error && (
              <div className="error-banner">{error}</div>
            )}

            {success && (
              <div className="success-banner">{success}</div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Password reset request form
  if (emailSent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>📧 Check Your Email</h2>
            <p>We've sent a password reset link to <strong>{email}</strong></p>
          </div>
          
          <div className="email-verification-notice">
            <div className="verification-steps">
              <h3>Next Steps:</h3>
              <ol>
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the password reset link in the email</li>
                <li>Create your new password</li>
              </ol>
            </div>

            <div className="resend-section">
              <p>Didn't receive the email?</p>
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setEmailSent(false)
                  setEmail('')
                  setSuccess('')
                }}
              >
                Try Again
              </button>
            </div>
          </div>

          <div className="auth-footer">
            <button 
              className="btn-link" 
              onClick={onBackToLogin}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>🔐 Forgot Password?</h2>
          <p>Enter your email to receive a password reset link</p>
        </div>

        <form onSubmit={handleRequestReset} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              className={`form-input ${error && !loading ? 'error' : ''}`}
              placeholder="Enter your email address"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="error-banner">{error}</div>
          )}

          {success && (
            <div className="success-banner">{success}</div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          <button 
            className="btn-link" 
            onClick={onBackToLogin}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  )
}

export default PasswordReset