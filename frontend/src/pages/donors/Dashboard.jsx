import React from 'react';
import { useDonorAuth } from '../../contexts/DonorAuthContext';
import { User, Heart, Calendar, TrendingUp, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DonorDashboard = () => {
  const { donor, signOut } = useDonorAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/donors/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">Donor Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {donor?.email || 'Donor'}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome to Your Donor Dashboard
          </h2>
          <p className="text-blue-100">
            Thank you for being part of our community. Your generosity makes a difference.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <Heart className="w-8 h-8 text-red-500" />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">$0.00</p>
            <p className="text-sm text-gray-600 mt-1">Donated</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <span className="text-sm text-gray-500">Campaigns</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-600 mt-1">Supported</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-blue-500" />
              <span className="text-sm text-gray-500">Last</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">--</p>
            <p className="text-sm text-gray-600 mt-1">Donation</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <User className="w-8 h-8 text-purple-500" />
              <span className="text-sm text-gray-500">Status</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">Active</p>
            <p className="text-sm text-gray-600 mt-1">Member</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Heart className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-center">
                No recent donations yet.
                <br />
                <span className="text-sm">Start supporting campaigns to see your activity here.</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/campaigns')}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between group"
              >
                <span className="text-gray-700">Browse Campaigns</span>
                <span className="text-gray-400 group-hover:text-gray-600">→</span>
              </button>
              <button
                onClick={() => navigate('/donors/profile')}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between group"
              >
                <span className="text-gray-700">Edit Profile</span>
                <span className="text-gray-400 group-hover:text-gray-600">→</span>
              </button>
              <button
                onClick={() => navigate('/donors/donations')}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between group"
              >
                <span className="text-gray-700">Donation History</span>
                <span className="text-gray-400 group-hover:text-gray-600">→</span>
              </button>
              <button
                onClick={() => navigate('/donors/settings')}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between group"
              >
                <span className="text-gray-700">Account Settings</span>
                <span className="text-gray-400 group-hover:text-gray-600">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Featured Campaigns */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Campaigns</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Placeholder campaign cards */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3"></div>
                <h4 className="font-medium text-gray-900 mb-1">Campaign Title {i}</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Campaign description will appear here...
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">$0 raised</span>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DonorDashboard;