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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }

      setUserProfile(data)
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    }
  }

  // Sign up with email and password
  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: `${window.location.origin}/auth?verified=true`
        }
      })

      if (error) throw error

      // Create user profile in our users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              full_name: fullName,
              email_confirmed: data.user.email_confirmed_at ? true : false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])

        if (profileError) {
          console.error('Error creating user profile:', profileError)
        }
      }

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

      if (error) throw error

      // Update login tracking
      if (data.user) {
        await supabase
          .from('users')
          .update({
            last_login_at: new Date().toISOString(),
            login_count: supabase.sql`login_count + 1`
          })
          .eq('id', data.user.id)
      }

      return { data, error: null }
    } catch (error) {
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

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setUserProfile(data)
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
    return user?.email_confirmed_at !== null
  }

  // Handle email verification callback
  const handleEmailVerification = async () => {
    try {
      if (!user) return { verified: false, error: 'No user found' }

      // Update local user profile with email confirmation status
      if (user.email_confirmed_at) {
        await supabase
          .from('users')
          .update({ 
            email_confirmed: true,
            email_confirmed_at: user.email_confirmed_at,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        // Refresh user profile
        await fetchUserProfile(user.id)
      }

      return { verified: !!user.email_confirmed_at, error: null }
    } catch (error) {
      return { verified: false, error }
    }
  }

  const value = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    getUserCampaigns,
    hasPermission,
    acceptInvitation,
    fetchUserProfile,
    isEmailVerified,
    handleEmailVerification
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}