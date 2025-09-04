import React, { useState } from 'react';
import { useDonorAuth } from '../../contexts/DonorAuthContext';
import { User, Heart, Calendar, TrendingUp, Settings, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const DonorDashboard = () => {
  const { donor, signOut } = useDonorAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('given');
  
  // Check for bypass mode
  const searchParams = new URLSearchParams(location.search);
  const bypassMode = searchParams.get('bypass') === 'true';
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('netlify.app');
  
  // Log debug info
  React.useEffect(() => {
    if (bypassMode && isDevelopment) {
      console.log('🚨 DONOR DASHBOARD - BYPASS MODE ACTIVE');
      console.log('Donor object:', donor);
      console.log('Location:', location.pathname + location.search);
    }
  }, [bypassMode, isDevelopment, donor, location]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/donors/auth');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--crypto-navy))' }}>
      {/* Header */}
      <header
        className="shadow-sm border-b"
        style={{ backgroundColor: 'hsl(var(--crypto-navy))', color: 'hsl(var(--crypto-white))' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="font-bold text-white" style={{ fontSize: 'var(--text-heading-lg)' }}>
                Donor Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-base text-white/80">Welcome, {donor?.email || (bypassMode ? 'Donor (Bypass Mode)' : 'Donor')}</span>
              {bypassMode && isDevelopment && (
                <span className="ml-2 px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
                  DEV BYPASS
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Given/Raised Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="crypto-card">
          <div className="flex items-center justify-center">
            <div className="flex bg-muted rounded-lg p-1" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'given'}
                onClick={() => setActiveTab('given')}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'given'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="given-tab"
              >
                Given
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'raised'}
                onClick={() => setActiveTab('raised')}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'raised'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="raised-tab"
              >
                Raised
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'given' && (
          <>
            {/* Welcome Section */}
            <div style={{ background: 'var(--gradient-hero)' }} className="rounded-2xl p-8 mb-8">
              <h2 className="font-bold mb-2 text-white" style={{ fontSize: 'var(--text-heading-xl)' }}>
                Welcome to Your Donor Dashboard
              </h2>
              <p className="text-white/90" style={{ fontSize: 'var(--text-body-lg)' }}>
                Thank you for being part of our community. Your generosity makes a difference.
              </p>
            </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="crypto-card">
            <div className="flex items-center justify-between mb-4">
              <Heart className="w-8 h-8" style={{ color: 'hsl(var(--crypto-blue))' }} />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold text-foreground">$0.00</p>
            <p className="text-sm text-muted-foreground mt-1">Donated</p>
          </div>

          <div className="crypto-card">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8" style={{ color: 'hsl(var(--crypto-blue))' }} />
              <span className="text-sm text-muted-foreground">Campaigns</span>
            </div>
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-sm text-muted-foreground mt-1">Supported</p>
          </div>

          <div className="crypto-card">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8" style={{ color: 'hsl(var(--crypto-blue))' }} />
              <span className="text-sm text-muted-foreground">Last</span>
            </div>
            <p className="text-2xl font-bold text-foreground">--</p>
            <p className="text-sm text-muted-foreground mt-1">Donation</p>
          </div>

          <div className="crypto-card">
            <div className="flex items-center justify-between mb-4">
              <User className="w-8 h-8" style={{ color: 'hsl(var(--crypto-blue))' }} />
              <span className="text-sm text-muted-foreground">Status</span>
            </div>
            <p className="text-2xl font-bold text-foreground">Active</p>
            <p className="text-sm text-muted-foreground mt-1">Member</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 crypto-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Heart className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-center">
                No recent donations yet.
                <br />
                <span className="text-base">
                  Start supporting campaigns to see your activity here.
                </span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="crypto-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/campaigns')}
                className="w-full px-4 py-3 text-left hover:bg-muted/80 rounded-lg transition-colors flex items-center justify-between group"
              >
                <span className="text-foreground">Browse Campaigns</span>
                <span className="text-muted-foreground group-hover:text-foreground">→</span>
              </button>
              <button
                onClick={() => navigate('/donors/profile')}
                className="w-full px-4 py-3 text-left hover:bg-muted/80 rounded-lg transition-colors flex items-center justify-between group"
              >
                <span className="text-foreground">Edit Profile</span>
                <span className="text-muted-foreground group-hover:text-foreground">→</span>
              </button>
              <button
                onClick={() => navigate('/donors/donations')}
                className="w-full px-4 py-3 text-left hover:bg-muted/80 rounded-lg transition-colors flex items-center justify-between group"
              >
                <span className="text-foreground">Donation History</span>
                <span className="text-muted-foreground group-hover:text-foreground">→</span>
              </button>
              <button
                onClick={() => navigate('/donors/settings')}
                className="w-full px-4 py-3 text-left hover:bg-muted/80 rounded-lg transition-colors flex items-center justify-between group"
              >
                <span className="text-foreground">Account Settings</span>
                <span className="text-muted-foreground group-hover:text-foreground">→</span>
              </button>
            </div>
          </div>
        </div>

            {/* Featured Campaigns */}
            <div className="mt-8 crypto-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Featured Campaigns</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Placeholder campaign cards */}
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
                  >
                    <div
                      className="h-32 rounded-lg mb-3"
                      style={{ background: 'var(--gradient-section)' }}
                    ></div>
                    <h4 className="font-medium text-foreground mb-1">Campaign Title {i}</h4>
                    <p className="text-base text-muted-foreground mb-3">
                      Campaign description will appear here...
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">$0 raised</span>
                      <button
                        className="text-sm font-medium"
                        style={{ color: 'hsl(var(--crypto-blue))' }}
                      >
                        View →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'raised' && (
          <div className="crypto-card p-12">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">Raised Funds Dashboard</h2>
              <p className="text-muted-foreground">
                This section will display information about funds you've helped raise for campaigns.
              </p>
              <div className="mt-6 py-8 border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground text-sm">Content coming soon...</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DonorDashboard;
