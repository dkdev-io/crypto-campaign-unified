import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const AuthLogin = ({ onSuccess, onSwitchToSignUp }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const from = location.state?.from?.pathname || '/setup'
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [verificationChecked, setVerificationChecked] = useState(false)

  const { signIn, handleEmailVerification } = useAuth()

  // Check for email verification on mount
  useEffect(() => {
    const checkVerification = async () => {
      if (searchParams.get('verified') === 'true' && !verificationChecked) {
        setVerificationChecked(true)
        const { verified } = await handleEmailVerification()
        if (verified) {
          setSuccess('Email verified successfully! You can now log in.')
        }
      }
    }
    checkVerification()
  }, [searchParams, verificationChecked, handleEmailVerification])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setErrors({})
    setSuccess('')

    try {
      const { data, error } = await signIn(formData.email, formData.password)

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ submit: 'Invalid email or password. Please try again.' })
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({ 
            submit: 'Please check your email and click the verification link before logging in.'
          })
        } else {
          setErrors({ submit: error.message })
        }
        return
      }

      // Check if user is verified
      if (data.user && !data.user.email_confirmed_at) {
        setErrors({ 
          submit: 'Please verify your email before logging in. Check your inbox for the verification link.' 
        })
        return
      }

      // Success - the AuthContext will handle the state update
      if (onSuccess) {
        onSuccess(data)
      } else {
        // Navigate to the protected page they were trying to access
        navigate(from, { replace: true })
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>🔐 Welcome Back</h2>
          <p>Sign in to your campaign management account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Enter your email address"
              required
              autoComplete="email"
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {errors.submit && (
            <div className="error-banner">
              {errors.submit}
            </div>
          )}

          {success && (
            <div className="success-banner">
              {success}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button 
              className="btn-link" 
              onClick={onSwitchToSignUp}
            >
              Sign Up
            </button>
          </p>
        </div>

        <div className="forgot-password">
          <button 
            className="btn-link"
            onClick={() => {
              // TODO: Implement forgot password functionality
              alert('Forgot password functionality coming soon!')
            }}
          >
            Forgot your password?
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthLogin