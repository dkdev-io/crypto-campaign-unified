import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDonorAuth } from '../../contexts/DonorAuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Heart, 
  DollarSign, 
  TrendingUp, 
  Award,
  Clock,
  Download,
  ChevronRight,
  Calendar,
  User,
  Settings,
  LogOut,
  FileText,
  Star
} from 'lucide-react';

const DonorDashboard = () => {
  const { donor, signOut } = useDonorAuth();
  const [stats, setStats] = useState({
    totalDonated: 0,
    donationCount: 0,
    campaignsSupported: 0,
    lastDonationDate: null
  });
  const [recentDonations, setRecentDonations] = useState([]);
  const [savedCampaigns, setSavedCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (donor) {
      fetchDonorData();
    }
  }, [donor]);

  const fetchDonorData = async () => {
    try {
      setLoading(true);

      // Fetch donation statistics
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_donor_stats', { p_donor_id: donor.id });

      if (!statsError && statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      // Fetch recent donations
      const { data: donationsData, error: donationsError } = await supabase
        .from('donations')
        .select(`
          *,
          campaigns (
            title,
            organization_name
          )
        `)
        .eq('donor_id', donor.id)
        .order('donation_date', { ascending: false })
        .limit(5);

      if (!donationsError) {
        setRecentDonations(donationsData || []);
      }

      // Fetch saved campaigns
      const { data: savedData, error: savedError } = await supabase
        .from('donor_saved_campaigns')
        .select(`
          *,
          campaigns (
            id,
            title,
            organization_name,
            goal_amount,
            current_amount,
            end_date,
            image_url
          )
        `)
        .eq('donor_id', donor.id)
        .order('saved_at', { ascending: false })
        .limit(3);

      if (!savedError) {
        setSavedCampaigns(savedData || []);
      }
    } catch (error) {
      console.error('Error fetching donor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-muted text-muted-foreground'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || statusClasses.pending}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  const calculateProgress = (campaign) => {
    if (!campaign || !campaign.goal_amount) return 0;
    return Math.min(100, (campaign.current_amount / campaign.goal_amount) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>
      {/* Header */}
      <div className="text-white" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-bold mb-2" style={{fontSize: 'var(--text-heading-xl)'}}>
                Welcome back, {donor?.profile?.full_name || 'Donor'}!
              </h1>
              <p className="text-blue-200">
                Thank you for making a difference through your generous support
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/donor/profile"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Profile Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <button
                onClick={signOut}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="font-bold text-foreground" style={{fontSize: 'var(--text-heading-lg)'}}>
              {formatCurrency(stats.totalDonated)}
            </p>
            <p className="text-sm text-gray-600">Total Donated</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-accent rounded-lg">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="font-bold text-foreground" style={{fontSize: 'var(--text-heading-lg)'}}>
              {stats.donationCount}
            </p>
            <p className="text-sm text-gray-600">Total Donations</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="font-bold text-foreground" style={{fontSize: 'var(--text-heading-lg)'}}>
              {stats.campaignsSupported}
            </p>
            <p className="text-sm text-gray-600">Campaigns Supported</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="font-bold text-foreground" style={{fontSize: 'var(--text-heading-lg)'}}>
              {formatDate(stats.lastDonationDate)}
            </p>
            <p className="text-sm text-gray-600">Last Donation</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Donations */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Donations</h2>
                  <Link 
                    to="/donor/donations" 
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View all <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {recentDonations.length > 0 ? (
                  recentDonations.map((donation) => (
                    <div key={donation.id} className="p-6 hover:bg-muted transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {donation.campaigns?.title || 'Anonymous Campaign'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {donation.campaigns?.organization_name || 'Organization'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(donation.donation_date)}
                            </span>
                            {donation.is_anonymous && (
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                Anonymous
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(donation.amount)}
                          </p>
                          <div className="mt-1">
                            {getStatusBadge(donation.status)}
                          </div>
                          {donation.status === 'completed' && (
                            <button className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1 ml-auto">
                              <Download className="w-4 h-4" />
                              Receipt
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No donations yet</p>
                    <Link 
                      to="/campaigns" 
                      className="mt-3 inline-block text-blue-600 hover:underline"
                    >
                      Browse campaigns to support
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Saved Campaigns */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Saved Campaigns</h2>
                  <Link 
                    to="/donor/campaigns" 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View all
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {savedCampaigns.length > 0 ? (
                  <div className="space-y-4">
                    {savedCampaigns.map((saved) => {
                      const campaign = saved.campaigns;
                      const progress = calculateProgress(campaign);
                      
                      return (
                        <Link 
                          key={saved.id}
                          to={`/campaigns/${campaign?.id}`}
                          className="block hover:bg-muted rounded-lg p-3 transition-colors"
                        >
                          <div className="flex gap-3">
                            {campaign?.image_url && (
                              <img 
                                src={campaign.image_url} 
                                alt={campaign.title}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {campaign?.title}
                              </h4>
                              <p className="text-sm text-gray-600 truncate">
                                {campaign?.organization_name}
                              </p>
                              <div className="mt-2">
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatCurrency(campaign?.current_amount)} of {formatCurrency(campaign?.goal_amount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center">
                    <Star className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No saved campaigns</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  to="/campaigns"
                  className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Browse Campaigns</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link
                  to="/donor/tax-receipts"
                  className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Tax Receipts</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link
                  to="/donor/profile"
                  className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Account Settings</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;