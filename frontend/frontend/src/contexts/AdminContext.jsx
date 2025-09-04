import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AdminContext = createContext();

// Development auth bypass configuration (shared with other auth contexts)
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';
const IS_DEVELOPMENT = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';

// Test admin user for bypass
const TEST_ADMIN = {
  id: 'test-admin-bypass-id',
  email: 'test@dkdev.io',
  full_name: 'Test Admin (Bypass)',
  role: 'super_admin',
  permissions: ['admin', 'export', 'view', 'manage', 'super_admin'],
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    // DEVELOPMENT AUTH BYPASS - Check if bypass is enabled
    if (SKIP_AUTH && IS_DEVELOPMENT) {
      console.warn('🚨 ADMIN AUTH BYPASS ACTIVE - Using test admin: test@dkdev.io');
      setAdmin(TEST_ADMIN);
      setPermissions(TEST_ADMIN.permissions);
      localStorage.setItem('admin_user', JSON.stringify(TEST_ADMIN));
      setLoading(false);
      return;
    }

    // Normal admin auth flow
    checkAdminAuth();

    // Don't set up auth listeners if bypass is active
    if (SKIP_AUTH && IS_DEVELOPMENT) {
      return () => {}; // No cleanup needed
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await checkAdminPermissions(session.user);
      } else if (event === 'SIGNED_OUT') {
        setAdmin(null);
        setPermissions([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminAuth = async () => {
    try {
      console.log('🔍 ADMIN CONTEXT - Checking admin auth...');

      // First check localStorage for stored admin
      const storedAdmin = localStorage.getItem('admin_user');
      if (storedAdmin) {
        console.log('🔍 ADMIN CONTEXT - Found stored admin in localStorage');
        const parsedAdmin = JSON.parse(storedAdmin);
        setAdmin(parsedAdmin);
        setPermissions(parsedAdmin.permissions || []);
        return;
      }

      // Fall back to Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        console.log('🔍 ADMIN CONTEXT - Found Supabase session, checking permissions...');
        await checkAdminPermissions(session.user);
      } else {
        console.log('🔍 ADMIN CONTEXT - No stored admin or Supabase session found');
      }
    } catch (error) {
      console.error('Error checking admin auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminPermissions = async (user) => {
    try {
      // Skip users table check - use auth user data directly for test@dkdev.io
      if (user.email === 'test@dkdev.io') {
        console.log('🔍 ADMIN CONTEXT - Recognizing test@dkdev.io as admin');
        const adminUser = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'Test Admin',
          role: 'super_admin',
          permissions: ['admin', 'export', 'view', 'manage', 'super_admin'],
        };

        setAdmin(adminUser);
        setPermissions(adminUser.permissions);
        localStorage.setItem('admin_user', JSON.stringify(adminUser));
      } else {
        setAdmin(null);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Error checking admin permissions:', error);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('🔍 ADMIN LOGIN - Attempting login for:', email);

      // Clear any existing state first
      setAdmin(null);
      setPermissions([]);
      localStorage.removeItem('admin_user');

      // Hardcoded admin credentials since you're the only admin
      if (email === 'test@dkdev.io' && password === 'TestDonor123!') {
        console.log('🔍 ADMIN LOGIN - Credentials match, creating admin user...');

        // Create mock admin user
        const mockAdmin = {
          id: 'admin-user',
          email: 'test@dkdev.io',
          full_name: 'Test Admin',
          role: 'super_admin',
          permissions: ['admin', 'export', 'view', 'manage', 'super_admin'],
        };

        // Set admin state
        setAdmin(mockAdmin);
        setPermissions(mockAdmin.permissions);

        // Store in localStorage for persistence
        localStorage.setItem('admin_user', JSON.stringify(mockAdmin));
        console.log('🔍 ADMIN LOGIN - Admin user set and stored in localStorage');
        console.log('🔍 ADMIN LOGIN - Admin state:', mockAdmin);

        return { success: true };
      }

      // For any other email/password combination, check Supabase
      try {
        console.log('🔍 ADMIN LOGIN - Trying Supabase authentication...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        await checkAdminPermissions(data.user);
        return { success: true };
      } catch (supabaseError) {
        console.log('🔍 ADMIN LOGIN - Supabase auth failed:', supabaseError.message);
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('🔍 ADMIN LOGIN - Error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      console.log('🔍 ADMIN LOGOUT - Clearing admin session...');

      // Clear admin state
      setAdmin(null);
      setPermissions([]);

      // Clear localStorage
      localStorage.removeItem('admin_user');

      // Sign out from Supabase (if connected)
      try {
        await supabase.auth.signOut();
      } catch (supabaseError) {
        console.log(
          '🔍 Supabase signout failed (expected if not connected):',
          supabaseError.message
        );
      }

      console.log('🔍 ADMIN LOGOUT - Admin session cleared');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupAdminAccount = async (email, password, fullName) => {
    try {
      setLoading(true);

      // Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      // Create admin user record
      const { error: userError } = await supabase.from('users').insert({
        id: signUpData.user.id,
        email,
        full_name: fullName,
        role: 'admin',
        permissions: ['admin', 'export', 'view'],
        email_confirmed: true,
        created_at: new Date().toISOString(),
      });

      if (userError) {
        throw userError;
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    return permissions.includes(permission) || admin?.role === 'super_admin';
  };

  const isAdmin = () => {
    return admin && ['admin', 'super_admin'].includes(admin.role);
  };

  const isSuperAdmin = () => {
    return admin && admin.role === 'super_admin';
  };

  const value = {
    admin,
    loading,
    permissions,
    login,
    logout,
    setupAdminAccount,
    hasPermission,
    isAdmin,
    isSuperAdmin,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
