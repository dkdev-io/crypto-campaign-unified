import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    overview: {
      totalRevenue: 0,
      totalTransactions: 0,
      totalUsers: 0,
      totalCampaigns: 0,
      conversionRate: 0,
      averageContribution: 0
    },
    timeSeriesData: [],
    topCampaigns: [],
    topContributors: [],
    paymentMethods: [],
    geographicData: [],
    userGrowth: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [exportFormat, setExportFormat] = useState('csv');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      // Load data in parallel
      const [
        transactionsResponse,
        usersResponse,
        campaignsResponse
      ] = await Promise.all([
        supabase
          .from('form_submissions')
          .select('*')
          .gte('submitted_at', startDate.toISOString())
          .lte('submitted_at', endDate.toISOString()),
        supabase
          .from('users')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('campaigns')
          .select('*')
      ]);

      const transactions = transactionsResponse.data || [];
      const users = usersResponse.data || [];
      const campaigns = campaignsResponse.data || [];

      // Calculate analytics
      const totalRevenue = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
      const totalTransactions = transactions.length;
      const totalUsers = users.length;
      const totalCampaigns = campaigns.length;
      const averageContribution = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      
      // Calculate conversion rate from actual data
      const conversionRate = totalUsers > 0 ? (totalTransactions / totalUsers) * 100 : 0;

      // Generate time series data
      const timeSeriesData = generateTimeSeriesData(transactions, startDate, endDate);
      
      // Top campaigns by revenue
      const campaignRevenue = transactions.reduce((acc, tx) => {
        if (tx.campaign_id) {
          acc[tx.campaign_id] = (acc[tx.campaign_id] || 0) + parseFloat(tx.amount || 0);
        }
        return acc;
      }, {});
      
      const topCampaigns = Object.entries(campaignRevenue)
        .map(([id, revenue]) => ({
          id,
          name: campaigns.find(c => c.id === id)?.name || `Campaign ${id}`,
          revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Top contributors
      const contributorData = transactions.reduce((acc, tx) => {
        const key = `${tx.first_name} ${tx.last_name}`;
        if (!acc[key]) {
          acc[key] = { name: key, email: tx.email, total: 0, count: 0 };
        }
        acc[key].total += parseFloat(tx.amount || 0);
        acc[key].count += 1;
        return acc;
      }, {});
      
      const topContributors = Object.values(contributorData)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Payment methods distribution
      const paymentMethodCounts = transactions.reduce((acc, tx) => {
        const method = tx.payment_method || 'crypto';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {});
      
      const paymentMethods = Object.entries(paymentMethodCounts)
        .map(([method, count]) => ({ method, count }));

      // User growth over time
      const userGrowth = generateUserGrowthData(users, startDate, endDate);

      setAnalytics({
        overview: {
          totalRevenue,
          totalTransactions,
          totalUsers,
          totalCampaigns,
          conversionRate,
          averageContribution
        },
        timeSeriesData,
        topCampaigns,
        topContributors,
        paymentMethods,
        userGrowth
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSeriesData = (transactions, startDate, endDate) => {
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTransactions = transactions.filter(tx => 
        tx.submitted_at.startsWith(dateStr)
      );
      
      const revenue = dayTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
      
      data.push({
        date: dateStr,
        revenue,
        transactions: dayTransactions.length,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    return data;
  };

  const generateUserGrowthData = (users, startDate, endDate) => {
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const data = [];
    let cumulativeUsers = 0;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayUsers = users.filter(user => 
        user.created_at.startsWith(dateStr)
      );
      
      cumulativeUsers += dayUsers.length;
      
      data.push({
        date: dateStr,
        newUsers: dayUsers.length,
        totalUsers: cumulativeUsers,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    return data;
  };

  const exportData = () => {
    let content = '';
    let filename = '';
    
    if (exportFormat === 'csv') {
      const csvRows = [
        ['Metric', 'Value'],
        ['Total Revenue', `$${analytics.overview.totalRevenue.toFixed(2)}`],
        ['Total Transactions', analytics.overview.totalTransactions],
        ['Total Users', analytics.overview.totalUsers],
        ['Total Campaigns', analytics.overview.totalCampaigns],
        ['Conversion Rate', `${analytics.overview.conversionRate.toFixed(2)}%`],
        ['Average Contribution', `$${analytics.overview.averageContribution.toFixed(2)}`]
      ];
      
      content = csvRows.map(row => row.join(',')).join('\n');
      filename = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const MetricCard = ({ title, value, change, icon, color = 'bg-blue-500' }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d={change >= 0 ? 'M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z' : 'M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z'} clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className={`${color} p-3 rounded-lg`}>
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
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
            <p className="text-gray-600 mt-1">Performance insights and detailed reporting</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={exportData}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(analytics.overview.totalRevenue)}
          change={15}
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>}
        />
        
        <MetricCard
          title="Total Transactions"
          value={analytics.overview.totalTransactions.toLocaleString()}
          change={8}
          color="bg-green-500"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>}
        />
        
        <MetricCard
          title="Average Contribution"
          value={formatCurrency(analytics.overview.averageContribution)}
          change={-3}
          color="bg-purple-500"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
          <div className="space-y-3">
            {analytics.timeSeriesData.slice(-7).map((item, index) => {
              const maxRevenue = Math.max(...analytics.timeSeriesData.map(d => d.revenue));
              const widthPercent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-16">{item.displayDate}</span>
                  <div className="flex items-center space-x-2 flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-20 text-right">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Campaigns */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Campaigns</h3>
          <div className="space-y-3">
            {analytics.topCampaigns.map((campaign, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-sm text-gray-900">{campaign.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(campaign.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {analytics.paymentMethods.map((method, index) => {
              const total = analytics.paymentMethods.reduce((sum, m) => sum + m.count, 0);
              const percentage = total > 0 ? (method.count / total) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{method.method}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-16 text-right">
                      {method.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Contributors */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h3>
          <div className="space-y-3">
            {analytics.topContributors.map((contributor, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">
                      {contributor.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{contributor.name}</div>
                    <div className="text-xs text-gray-500">{contributor.count} contributions</div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(contributor.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;