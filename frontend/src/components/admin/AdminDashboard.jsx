import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCampaigns: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingCampaigns: 0,
    recentTransactions: [],
    campaignMetrics: [],
    userGrowth: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load basic stats
      const [
        usersResponse,
        campaignsResponse,
        transactionsResponse
      ] = await Promise.all([
        supabase.from('users').select('id, created_at, last_login_at'),
        supabase.from('campaigns').select('id, status, created_at'),
        supabase.from('form_submissions').select('id, amount, submitted_at').order('submitted_at', { ascending: false }).limit(10)
      ]);

      const users = usersResponse.data || [];
      const campaigns = campaignsResponse.data || [];
      const transactions = transactionsResponse.data || [];

      // Calculate active users (logged in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsers = users.filter(user => 
        user.last_login_at && new Date(user.last_login_at) > thirtyDaysAgo
      ).length;

      // Calculate total revenue
      const totalRevenue = transactions.reduce((sum, transaction) => 
        sum + (parseFloat(transaction.amount) || 0), 0
      );

      // Calculate pending campaigns
      const pendingCampaigns = campaigns.filter(campaign => 
        campaign.status === 'pending'
      ).length;

      // User growth over last 6 months
      const userGrowth = calculateUserGrowth(users);

      setStats({
        totalUsers: users.length,
        totalCampaigns: campaigns.length,
        totalTransactions: transactions.length,
        totalRevenue,
        activeUsers,
        pendingCampaigns,
        recentTransactions: transactions.slice(0, 5),
        campaignMetrics: calculateCampaignMetrics(campaigns),
        userGrowth
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserGrowth = (users) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const growth = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const count = users.filter(user => {
        const createdAt = new Date(user.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length;
      
      growth.push({
        month: months[date.getMonth()],
        count
      });
    }
    
    return growth;
  };

  const calculateCampaignMetrics = (campaigns) => {
    const statusCounts = campaigns.reduce((acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] || 0) + 1;
      return acc;
    }, {});

    return [
      { status: 'Active', count: statusCounts.active || 0, color: 'bg-green-500' },
      { status: 'Pending', count: statusCounts.pending || 0, color: 'bg-yellow-500' },
      { status: 'Completed', count: statusCounts.completed || 0, color: 'bg-blue-500' },
      { status: 'Suspended', count: statusCounts.suspended || 0, color: 'bg-red-500' }
    ];
  };

  const StatCard = ({ title, value, icon, color = 'bg-primary', change }) => (
    <div className="crypto-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d={change >= 0 ? 'M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z' : 'M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z'} clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className={`${color} p-3 rounded-lg text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="crypto-card">
        <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-1">Monitor your platform's performance and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={12}
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>}
        />
        
        <StatCard
          title="Active Campaigns"
          value={stats.totalCampaigns}
          change={8}
          color="bg-accent"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>}
        />
        
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          change={23}
          color="bg-secondary"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>}
        />
        
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          change={5}
          color="bg-primary"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>}
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="crypto-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">User Growth</h3>
          <div className="space-y-3">
            {stats.userGrowth.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.month}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(item.count / Math.max(...stats.userGrowth.map(g => g.count))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-foreground w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Status */}
        <div className="crypto-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Campaign Status</h3>
          <div className="space-y-4">
            {stats.campaignMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${metric.color}`}></div>
                  <span className="text-sm text-muted-foreground">{metric.status}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{metric.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="crypto-card">
        <div className="pb-4 border-b border-border mb-4">
          <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
          <p className="text-muted-foreground text-sm mt-1">Latest campaign contributions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {stats.recentTransactions.map((transaction, index) => (
                <tr key={transaction.id || index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    #{transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    ${parseFloat(transaction.amount || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(transaction.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="crypto-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center px-4 py-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors duration-200">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Campaign
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-accent/10 text-accent-foreground rounded-lg hover:bg-accent/20 transition-colors duration-200">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add User
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-secondary/20 text-secondary-foreground rounded-lg hover:bg-secondary/30 transition-colors duration-200">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Report
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors duration-200">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;