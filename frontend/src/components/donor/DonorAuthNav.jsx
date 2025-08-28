import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, UserPlus, LogIn, Shield, FileText } from 'lucide-react';
import DonorBreadcrumb from './DonorBreadcrumb';

const DonorAuthNav = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="sticky top-0 z-50">
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-navy-900">
                NEXTRAISE
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            
            <Link
              to="/donors/auth/register"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive('/donors/auth/register') 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </Link>
            
            <Link
              to="/donors/auth/login"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive('/donors/auth/login') 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
            
            <div className="h-6 w-px bg-gray-300"></div>
            
            <Link
              to="/donors/auth/terms"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive('/donors/auth/terms') 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <FileText className="w-4 h-4" />
              Terms
            </Link>
            
            <Link
              to="/donors/auth/privacy"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive('/donors/auth/privacy') 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Shield className="w-4 h-4" />
              Privacy
            </Link>
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-4">
            <Link
              to="/donors/auth/register"
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      </nav>
      <DonorBreadcrumb />
    </div>
  );
};

export default DonorAuthNav;