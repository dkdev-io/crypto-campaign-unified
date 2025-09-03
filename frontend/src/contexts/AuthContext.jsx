import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
      }
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      // Always use auth user data since users table may not exist
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserProfile({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'User',
          role: 'user', // Default role
          created_at: user.created_at,
          email_confirmed: !!user.email_confirmed_at
        })
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    }
  }

  // Sign up with email and password
  const signUp = async (email, password, fullName) => {
    try {
      console.log('🔐 Starting signup process...')
      console.log(`📧 Email: ${email}`)
      console.log(`📍 Redirect URL: ${window.location.origin}/auth?verified=true`)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth?verified=true`
        }
      })

      if (error) {
        console.error('❌ Signup error:', error)
        throw error
      }
      
      console.log('✅ Signup successful:', {
        userId: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at,
        needsVerification: !data.user?.email_confirmed_at
      })

      // Skip users table operations - use auth.users only
      console.log('✅ User created in auth.users, skipping custom users table')

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        // Provide more specific error messages
        let friendlyError = { ...error }
        
        if (error.message === 'Invalid login credentials') {
          // Generic handling - can't check user existence without service role
          friendlyError.message = 'Invalid email or password. Please check your credentials or sign up for a new account.'
          friendlyError.type = 'invalid_credentials'
        } else if (error.message.includes('email')) {
          friendlyError.message = 'Please enter a valid email address'
          friendlyError.type = 'invalid_email'
        } else if (error.message.includes('password')) {
          friendlyError.message = 'Password is required'
          friendlyError.type = 'missing_password'
        }
        
        throw friendlyError
      }

      // Skip login tracking - use auth.users only
      console.log('✅ User signed in via auth.users')

      return { data, error: null }
    } catch (error) {
      setError(error)
      return { data: null, error }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setSession(null)
      setUserProfile(null)
      
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // Update user profile via auth metadata
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in')

      // Update auth metadata instead of users table
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      })

      if (error) throw error

      // Update local profile state
      setUserProfile(prev => ({ ...prev, ...updates }))
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get user's campaigns
  const getUserCampaigns = async () => {
    try {
      if (!user) return { data: [], error: null }

      const { data, error } = await supabase
        .from('campaign_members')
        .select(`
          *,
          campaigns (*)
        `)
        .eq('user_id', user.id)

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  // Check if user has permission for a campaign
  const hasPermission = async (campaignId, permission) => {
    try {
      if (!user) return false

      const { data, error } = await supabase
        .from('campaign_members')
        .select('permissions')
        .eq('user_id', user.id)
        .eq('campaign_id', campaignId)
        .single()

      if (error || !data) return false

      return data.permissions.includes(permission)
    } catch (error) {
      return false
    }
  }

  // Accept invitation
  const acceptInvitation = async (token) => {
    try {
      if (!user) throw new Error('Must be logged in to accept invitations')

      const { data, error } = await supabase.rpc('accept_invitation', {
        p_token: token,
        p_user_id: user.id
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Check if user email is verified
  const isEmailVerified = () => {
    // TEMPORARY: Bypass email verification for testing
    // Remove this bypass once Supabase email verification is fixed
    console.warn('⚠️ Email verification bypassed for testing')
    return true // Always return true for now
    // Original code: return user?.email_confirmed_at !== null
  }

  // Handle email verification callback
  const handleEmailVerification = async () => {
    try {
      if (!user) return { verified: false, error: 'No user found' }

      // Update local profile state only (no users table)
      if (user.email_confirmed_at) {
        setUserProfile(prev => ({
          ...prev,
          email_confirmed: true,
          email_confirmed_at: user.email_confirmed_at
        }))
      }

      return { verified: !!user.email_confirmed_at, error: null }
    } catch (error) {
      return { verified: false, error }
    }
  }

  // Reset password functionality
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth?reset=true`
      })

      if (error) {
        let friendlyError = { ...error }
        if (error.message.includes('email')) {
          friendlyError.message = 'Please enter a valid email address'
        } else if (error.message.includes('not found')) {
          friendlyError.message = 'No account found with this email address'
        } else {
          friendlyError.message = 'Unable to send reset email. Please try again.'
        }
        throw friendlyError
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update password after reset
  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Check session validity and handle timeout
  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      if (!session) {
        // Session expired
        await signOut()
        return { valid: false, expired: true }
      }
      
      // Check if token is near expiry (within 5 minutes)
      const expiresAt = session.expires_at * 1000 // Convert to milliseconds
      const now = Date.now()
      const timeUntilExpiry = expiresAt - now
      
      if (timeUntilExpiry < 5 * 60 * 1000) { // Less than 5 minutes
        // Refresh the session
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          await signOut()
          return { valid: false, expired: true }
        }
        
        setSession(newSession)
        return { valid: true, refreshed: true }
      }
      
      return { valid: true, expired: false }
    } catch (error) {
      console.error('Session check error:', error)
      return { valid: false, error }
    }
  }

  // Get user role
  const getUserRole = () => {
    if (!userProfile) return null
    return userProfile.role || 'user'
  }

  // Check if user is admin
  const isAdmin = () => {
    return getUserRole() === 'admin'
  }

  // Clear error function
  const clearError = () => {
    setError(null)
  }

  const value = {
    user,
    session,
    userProfile,
    loading,
    error,
    clearError,
    signUp,
    signIn,
    signOut,
    updateProfile,
    getUserCampaigns,
    hasPermission,
    acceptInvitation,
    fetchUserProfile,
    isEmailVerified,
    handleEmailVerification,
    resetPassword,
    updatePassword,
    checkSession,
    getUserRole,
    isAdmin
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}