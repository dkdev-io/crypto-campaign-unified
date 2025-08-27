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

  const MetricCard = ({ title, value, change, icon }) => (
    <div className="crypto-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span className="text-sm font-medium">{change >= 0 ? '↗' : '↘'} {Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className="bg-primary text-primary-foreground p-3 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="crypto-card">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Analytics & Reports</h2>
            <p className="text-muted-foreground mt-1">Performance insights and detailed reporting</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="form-input"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={exportData}
              className="btn-secondary flex items-center"
            >
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
          icon={"💰"}
        />
        
        <MetricCard
          title="Total Transactions"
          value={analytics.overview.totalTransactions.toLocaleString()}
          change={8}
          icon={"📊"}
        />
        
        <MetricCard
          title="Average Contribution"
          value={formatCurrency(analytics.overview.averageContribution)}
          change={-3}
          icon={"📈"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="crypto-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Over Time</h3>
          <div className="space-y-3">
            {analytics.timeSeriesData.slice(-7).map((item, index) => {
              const maxRevenue = Math.max(...analytics.timeSeriesData.map(d => d.revenue));
              const widthPercent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground w-16">{item.displayDate}</span>
                  <div className="flex items-center space-x-2 flex-1 mx-4">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground w-20 text-right">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Campaigns */}
        <div className="crypto-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Performing Campaigns</h3>
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
                  <span className="text-sm text-foreground">{campaign.name}</span>
                </div>
                <span className="text-sm font-medium text-foreground">
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
        <div className="crypto-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {analytics.paymentMethods.map((method, index) => {
              const total = analytics.paymentMethods.reduce((sum, m) => sum + m.count, 0);
              const percentage = total > 0 ? (method.count / total) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{method.method}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-foreground w-16 text-right">
                      {method.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Contributors */}
        <div className="crypto-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Contributors</h3>
          <div className="space-y-3">
            {analytics.topContributors.map((contributor, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-foreground">
                      {contributor.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{contributor.name}</div>
                    <div className="text-xs text-muted-foreground">{contributor.count} contributions</div>
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">
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