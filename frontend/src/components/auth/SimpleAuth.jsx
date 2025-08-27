import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import RealWorkingInvites from '../team/RealWorkingInvites'
import CampaignBreadcrumb from '../campaigns/CampaignBreadcrumb'

// Simple auth component - no complex flows
const SimpleAuthContent = () => {
  const { user, userProfile, signUp, signIn, signOut, updateProfile, loading, isEmailVerified, handleEmailVerification } = useAuth()
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [showProfile, setShowProfile] = useState(false)
  const [showInvites, setShowInvites] = useState(false)
  const [emailVerificationMessage, setEmailVerificationMessage] = useState('')

  // Check for email verification callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('verified') === 'true') {
      setEmailVerificationMessage('Email verified successfully! You can now proceed to campaign setup.')
      // Handle the verification
      if (user) {
        handleEmailVerification()
        // After a short delay, redirect to setup
        setTimeout(() => {
          window.location.href = '/setup'
        }, 2000)
      }
    }
  }, [user, handleEmailVerification])

  // Loading state
  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  // Show email verification message
  if (emailVerificationMessage) {
    return (
      <div>
        <CampaignBreadcrumb />
        <div className="container-responsive" style={{ maxWidth: '600px', padding: '2rem', textAlign: 'center' }}>
          <div style={{ 
            background: 'hsl(var(--crypto-blue) / 0.1)', 
            border: '1px solid hsl(var(--crypto-blue) / 0.3)',
            borderRadius: 'var(--radius)',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h2 style={{ color: 'hsl(var(--crypto-blue))', marginBottom: '1rem' }}>✅ Verification Complete</h2>
            <p style={{ color: 'hsl(var(--crypto-blue))' }}>{emailVerificationMessage}</p>
            <p style={{ color: 'hsl(var(--crypto-medium-gray))', fontSize: 'var(--text-body-sm)', marginTop: '1rem' }}>
              Redirecting to campaign setup...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // User is authenticated
  if (user) {
    // Check if email is verified
    if (!isEmailVerified()) {
      return (
        <div className="container-responsive" style={{ maxWidth: '600px', padding: '2rem', textAlign: 'center' }}>
          <div style={{ 
            background: 'hsl(var(--crypto-gold) / 0.1)', 
            border: '1px solid hsl(var(--crypto-gold) / 0.3)',
            borderRadius: 'var(--radius)',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h2 style={{ color: 'hsl(var(--crypto-navy))', marginBottom: '1rem' }}>📧 Verify Your Email</h2>
            <p style={{ color: 'hsl(var(--crypto-medium-gray))', marginBottom: '1rem' }}>
              We sent a verification link to <strong>{user.email}</strong>
            </p>
            <p style={{ color: 'hsl(var(--crypto-medium-gray))', fontSize: 'var(--text-body-sm)' }}>
              Please check your email and click the verification link to continue with campaign setup.
            </p>
            <button 
              onClick={signOut}
              className="btn-secondary"
              style={{ marginTop: '1rem' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )
    }

    // Email is verified, proceed with normal flow
    // If profile complete, show team invites
    if (showInvites || (userProfile?.full_name && userProfile?.phone)) {
      return (
        <div>
          <CampaignBreadcrumb />
          <div className="container-responsive" style={{ maxWidth: '800px' }}>
            <RealWorkingInvites campaignId="default-campaign" />
          </div>
        </div>
      )
    }

    // Show contact form
    return (
      <div>
        <CampaignBreadcrumb />
        <div className="container-responsive" style={{ maxWidth: '600px' }}>
          <ContactForm onComplete={() => setShowInvites(true)} />
        </div>
      </div>
    )
  }

  // User not authenticated - show login/signup
  return (
    <div>
      <CampaignBreadcrumb />
      <div className="container-responsive" style={{ maxWidth: '400px' }}>
        {mode === 'login' ? (
          <LoginForm onSuccess={() => {}} onSwitchMode={() => setMode('signup')} />
        ) : (
          <SignupForm onSuccess={() => {}} onSwitchMode={() => setMode('login')} />
        )}
      </div>
    </div>
  )
}

// Contact information form  
const ContactForm = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: '',
    job_title: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  })
  const [loading, setLoading] = useState(false)
  const { updateProfile } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await updateProfile(formData)
      if (error) {
        alert('Error: ' + error.message)
      } else {
        onComplete()
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <input
        type="text"
        placeholder="Full Name"
        value={formData.full_name}
        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
        required
        className="form-input"
      />
      <input
        type="tel"
        placeholder="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        required
        className="form-input"
      />
      <input
        type="text"
        placeholder="Company"
        value={formData.company}
        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
        className="form-input"
      />
      <input
        type="text"
        placeholder="Job Title"
        value={formData.job_title}
        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
        className="form-input"
      />
      <input
        type="text"
        placeholder="Address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        className="form-input"
      />
      <input
        type="text"
        placeholder="City"
        value={formData.city}
        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        className="form-input"
      />
      <input
        type="text"
        placeholder="State"
        value={formData.state}
        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
        className="form-input"
      />
      <input
        type="text"
        placeholder="ZIP"
        value={formData.zip}
        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
        className="form-input"
      />
      <button 
        type="submit" 
        disabled={loading}
        className="btn-primary"
        style={{ 
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Saving...' : 'Submit'}
      </button>
    </form>
  )
}

// Simple login form
const LoginForm = ({ onSuccess, onSwitchMode }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        alert('Error: ' + error.message)
      } else {
        onSuccess()
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Sign In</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="form-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="form-input"
      />
      <button 
        type="submit" 
        disabled={loading}
        className="btn-primary"
        style={{ 
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      <button 
        type="button" 
        onClick={onSwitchMode}
        style={{ 
          padding: '0.5rem', 
          fontSize: '14px', 
          background: 'transparent', 
          color: '#007bff', 
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'underline'
        }}
      >
        Need an account? Sign up
      </button>
    </form>
  )
}

// Simple signup form
const SignupForm = ({ onSuccess, onSwitchMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(formData.email, formData.password, formData.fullName)
      if (error) {
        alert('Error: ' + error.message)
      } else {
        alert('Check your email for verification link')
        onSuccess()
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Create Account</h2>
      <input
        type="text"
        placeholder="Full Name"
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        required
        className="form-input"
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        className="form-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        className="form-input"
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        required
        className="form-input"
      />
      <button 
        type="submit" 
        disabled={loading}
        className="btn-primary"
        style={{ 
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
      <button 
        type="button" 
        onClick={onSwitchMode}
        style={{ 
          padding: '0.5rem', 
          fontSize: '14px', 
          background: 'transparent', 
          color: '#007bff', 
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'underline'
        }}
      >
        Already have an account? Sign in
      </button>
    </form>
  )
}

// Main component with auth provider
const SimpleAuth = () => {
  return (
    <AuthProvider>
      <SimpleAuthContent />
    </AuthProvider>
  )
}

export default SimpleAuth