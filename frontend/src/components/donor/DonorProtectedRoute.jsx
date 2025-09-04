import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDonorAuth } from '../../contexts/DonorAuthContext';

const DonorProtectedRoute = ({ children }) => {
  const { donor, loading } = useDonorAuth();
  const location = useLocation();

  // Check for development bypass parameter
  const searchParams = new URLSearchParams(location.search);
  const bypassParam = searchParams.get('bypass');
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('netlify.app');
  const shouldBypass = isDevelopment && bypassParam === 'true';
  
  // Debug logging
  console.log('🔍 DONOR PROTECTED ROUTE DEBUG:');
  console.log('- URL:', location.pathname + location.search);
  console.log('- bypassParam:', bypassParam);
  console.log('- isDevelopment:', isDevelopment);
  console.log('- shouldBypass:', shouldBypass);
  console.log('- donor:', !!donor);
  console.log('- loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!donor && !shouldBypass) {
    // Redirect to login page but save the attempted location with bypass parameter
    const redirectUrl = bypassParam ? `/donors/auth/login?bypass=true` : '/donors/auth/login';
    return <Navigate to={redirectUrl} state={{ from: location }} replace />;
  }

  if (shouldBypass) {
    console.log('🚨 DONOR PROTECTED ROUTE BYPASS ACTIVE');
  }

  return children;
};

export default DonorProtectedRoute;
