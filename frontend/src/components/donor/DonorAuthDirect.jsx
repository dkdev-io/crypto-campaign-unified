import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, User, Phone, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import DonorAuthNav from './DonorAuthNav';

// Direct donor auth component that bypasses context checks
const DonorAuthDirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  // Sign In Form Data
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleSignInChange = (e) => {
    const { name, value } = e.target;
    setSignInData(prev => ({
      ...prev,
      [name]: value
    }));
    clearError(name);
  };

  const clearError = (fieldName) => {
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const validateSignIn = () => {
    const errors = {};

    if (!signInData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signInData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!signInData.password) {
      errors.password = 'Password is required';
    }

    return errors;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    const errors = validateSignIn();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Attempting direct login with:', signInData.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password
      });

      if (error) {
        console.error('❌ Login error:', error);
        setError(error.message);
        return;
      }

      console.log('✅ Login successful!', data.user.email);
      
      // Redirect to dashboard or wherever
      navigate('/donors/dashboard');
      
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <DonorAuthNav />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-card rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Direct Donor Login (Testing)
              </h2>
              <p className="text-muted-foreground">
                This bypasses auth context for testing
              </p>
            </div>

            {/* Error Display */}
            {(error || validationErrors.submit) && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">
                  {validationErrors.submit || error || 'An error occurred. Please try again.'}
                </span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label htmlFor="signin-email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    value={signInData.email}
                    onChange={handleSignInChange}
                    className={`pl-10 ${validationErrors.email ? 'border-destructive' : ''}`}
                    placeholder="Enter your email"
                  />
                </div>
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-destructive">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="signin-password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={signInData.password}
                    onChange={handleSignInChange}
                    className={`pl-10 pr-10 ${validationErrors.password ? 'border-destructive' : ''}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-xs text-destructive">{validationErrors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Signing In...
                  </>
                ) : (
                  'Sign In (Direct Test)'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorAuthDirect;