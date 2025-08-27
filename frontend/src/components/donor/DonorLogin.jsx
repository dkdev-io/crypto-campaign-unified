import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDonorAuth } from '../../contexts/DonorAuthContext';
import { Mail, Lock, AlertCircle, Heart } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import DonorAuthNav from './DonorAuthNav';

const DonorLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, error } = useDonorAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  const from = location.state?.from?.pathname || '/donors/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        throw error;
      }

      // Navigate to dashboard or return URL
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <DonorAuthNav />
      <div className="flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full mb-4">
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Donor Sign In
            </h2>
            <p className="text-muted-foreground">
              Access your donor account
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {location.state?.message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              <span className="text-sm">{location.state.message}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="donor@example.com"
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link 
                  to="/donors/auth/forgot-password" 
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                />
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have a donor account?{' '}
            <Link to="/donors/auth/register" className="font-medium text-blue-600 hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default DonorLogin;