import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Spinner } from '../ui/spinner'

const AuthSignUp = ({ onSuccess, onSwitchToLogin, prefillEmail = '' }) => {
  const [formData, setFormData] = useState({
    email: prefillEmail,
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const { signUp } = useAuth()

  // Update email when prefillEmail prop changes
  useEffect(() => {
    if (prefillEmail && prefillEmail !== formData.email) {
      setFormData(prev => ({ ...prev, email: prefillEmail }))
    }
  }, [prefillEmail, formData.email])

  const validateForm = () => {
    const newErrors = {}

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      const { data, error } = await signUp(
        formData.email,
        formData.password,
        formData.fullName
      )

      if (error) {
        // Handle specific error messages with user-friendly responses
        if (error.message.includes('already registered') || 
            error.message.includes('User already registered')) {
          setErrors({ submit: 'Email already registered. Please sign in or use a different email.' })
        } else if (error.message.includes('Password should be')) {
          setErrors({ submit: 'Password does not meet security requirements. Please use at least 8 characters.' })
        } else if (error.message.includes('Network request failed') || 
                   error.message.includes('Failed to fetch')) {
          setErrors({ submit: 'Connection failed. Please check your internet connection and try again.' })
        } else if (error.message.includes('rate limit')) {
          setErrors({ submit: 'Too many signup attempts. Please wait a moment and try again.' })
        } else {
          setErrors({ submit: 'An unexpected error occurred. Please try again.' })
        }
        return
      }

      // Show email verification message - don't call onSuccess yet
      // The user needs to verify their email first before proceeding
      setEmailSent(true)
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

  if (emailSent) {
    return (
      <div className="min-h-screen" style={{background: 'var(--gradient-hero)'}}>
        <div className="flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            <div className="bg-card rounded-2xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="font-bold text-foreground mb-2" style={{fontSize: 'var(--text-heading-xl)'}}>
                  Check Your Email
                </h2>
                <p className="text-muted-foreground">
                  We've sent a verification link to <strong className="text-foreground">{formData.email}</strong>
                </p>
              </div>
          
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Next Steps:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Return here and log in to complete your profile</li>
              </ol>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">Didn't receive the email?</p>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => setEmailSent(false)}
              >
                Try Different Email
              </Button>
            </div>
          </div>

              <div className="text-center text-sm">
                <p className="text-muted-foreground">
                  Already have an account?{' '}
                  <button 
                    className="font-medium text-primary hover:underline" 
                    onClick={onSwitchToLogin}
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{background: 'var(--gradient-hero)'}}>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-card rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="font-bold text-foreground mb-2" style={{fontSize: 'var(--text-heading-xl)'}}>
                Create Your Account
              </h2>
              <p className="text-muted-foreground">
                Start managing your campaign today
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={errors.fullName ? 'border-destructive' : ''}
                placeholder="Enter your full name"
                required
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
                placeholder="Enter your email address"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={errors.password ? 'border-destructive' : ''}
                placeholder="Enter a strong password"
                required
              />
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={errors.confirmPassword ? 'border-destructive' : ''}
                placeholder="Confirm your password"
                required
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
              {errors.submit}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
            </form>

            <div className="text-center text-sm mt-6">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <button 
                  className="font-medium text-primary hover:underline" 
                  onClick={onSwitchToLogin}
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthSignUp