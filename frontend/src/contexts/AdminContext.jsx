import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AdminContext = createContext();

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
    checkAdminAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await checkAdminPermissions(session.user);
        } else if (event === 'SIGNED_OUT') {
          setAdmin(null);
          setPermissions([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await checkAdminPermissions(session.user);
      }
    } catch (error) {
      console.error('Error checking admin auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminPermissions = async (user) => {
    try {
      // Check if user has admin role
      const { data: userData, error } = await supabase
        .from('users')
        .select('*, role, permissions')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      // Check if user is admin or super_admin
      if (userData && ['admin', 'super_admin'].includes(userData.role)) {
        setAdmin(userData);
        setPermissions(userData.permissions || []);
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
      
      // Hardcoded admin credentials since you're the only admin
      if (email === 'dan@dkdev.io' && password === 'admin123') {
        // Create mock admin user
        const mockAdmin = {
          id: 'admin-user',
          email: 'dan@dkdev.io',
          full_name: 'Dan Kovacs',
          role: 'super_admin',
          permissions: ['admin', 'export', 'view', 'manage', 'super_admin']
        };
        
        setAdmin(mockAdmin);
        setPermissions(mockAdmin.permissions);
        return { success: true };
      }
      
      // If Supabase is configured, use it as fallback
      try {
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
        // If Supabase fails, return generic error
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setAdmin(null);
      setPermissions([]);
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
      const { error: userError } = await supabase
        .from('users')
        .insert({
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

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};