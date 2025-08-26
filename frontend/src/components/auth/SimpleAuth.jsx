import React, { useState } from 'react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import WorkingTeamInvites from '../team/WorkingTeamInvites'

// Simple auth component - no complex flows
const SimpleAuthContent = () => {
  const { user, userProfile, signUp, signIn, signOut, updateProfile, loading } = useAuth()
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [showProfile, setShowProfile] = useState(false)
  const [showInvites, setShowInvites] = useState(false)

  // Loading state
  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  // User is authenticated
  if (user) {
    // If profile complete, show team invites
    if (showInvites || (userProfile?.full_name && userProfile?.phone)) {
      return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
          <WorkingTeamInvites campaignId="default-campaign" />
        </div>
      )
    }

    // Show contact form
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
        <ContactForm onComplete={() => setShowInvites(true)} />
      </div>
    )
  }

  // User not authenticated - show login/signup
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
      {mode === 'login' ? (
        <LoginForm onSuccess={() => {}} onSwitchMode={() => setMode('signup')} />
      ) : (
        <SignupForm onSuccess={() => {}} onSwitchMode={() => setMode('login')} />
      )}
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
        style={{ padding: '0.75rem', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="tel"
        placeholder="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        required
        style={{ padding: '0.75rem', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="text"
        placeholder="Company"
        value={formData.company}
        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
        style={{ padding: '0.75rem', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="text"
        placeholder="Job Title"
        value={formData.job_title}
        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
        style={{ padding: '0.75rem', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="text"
        placeholder="Address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        style={{ padding: '0.75rem', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="text"
        placeholder="City"
        value={formData.city}
        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        style={{ padding: '0.75rem', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="text"
        placeholder="State"
        value={formData.state}
        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
        style={{ padding: '0.75rem', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="text"
        placeholder="ZIP"
        value={formData.zip}
        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
        style={{ padding: '0.75rem', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <button 
        type="submit" 
        disabled={loading}
        style={{ 
          padding: '0.75rem', 
          fontSize: '16px', 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1
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
        style={{ padding: '0.75rem', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={{ padding: '0.75rem', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <button 
        type="submit" 
        disabled={loading}
        style={{ 
          padding: '0.75rem', 
          fontSize: '16px', 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1
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
        style={{ padding: '0.75rem', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        style={{ padding: '0.75rem', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        style={{ padding: '0.75rem', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        required
        style={{ padding: '0.75rem', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <button 
        type="submit" 
        disabled={loading}
        style={{ 
          padding: '0.75rem', 
          fontSize: '16px', 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1
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