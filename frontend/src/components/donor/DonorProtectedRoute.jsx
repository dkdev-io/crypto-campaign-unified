import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDonorAuth } from '../../contexts/DonorAuthContext';

const DonorProtectedRoute = ({ children }) => {
  const { donor, loading } = useDonorAuth();
  const location = useLocation();

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

  if (!donor) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/donors/auth/login" state={{ from: location }} replace />;
  }

  return children;
};

export default DonorProtectedRoute;