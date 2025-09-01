import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: 'dan@dkdev.io',
    password: 'admin123'
  });
  const [setupData, setSetupData] = useState({
    email: 'dan@dkdev.io',
    password: '',
    confirmPassword: '',
    fullName: 'Dan Kovacs'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState(false);
  
  const { login, setupAdminAccount, admin, isAdmin } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin()) {
      navigate('/admin/dashboard');
    }
  }, [admin, isAdmin, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');
    
    if (setupData.password !== setupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (setupData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    
    const result = await setupAdminAccount(
      setupData.email,
      setupData.password,
      setupData.fullName
    );
    
    if (result.success) {
      setSetupSuccess(true);
      setShowSetup(false);
      setError('');
    } else {
      setError(result.error || 'Setup failed');
    }
    
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showSetup) {
      setSetupData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="crypto-card w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Admin Portal</h2>
          <p className="text-muted-foreground">
            {showSetup ? 'Set up your admin account' : 'Sign in to manage the platform'}
          </p>
        </div>

        {setupSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Admin account created successfully! You can now log in.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {showSetup ? (
          <form onSubmit={handleSetup} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={setupData.fullName}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={setupData.email}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={setupData.password}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Create a strong password"
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={setupData.confirmPassword}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Confirm your password"
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up...' : 'Create Admin Account'}
            </button>

            <button
              type="button"
              onClick={() => setShowSetup(false)}
              className="w-full text-muted-foreground hover:text-foreground font-medium transition-colors duration-200"
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Enter your admin email"
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </form>
        )}

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            NEXTRAISE Admin Portal
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;