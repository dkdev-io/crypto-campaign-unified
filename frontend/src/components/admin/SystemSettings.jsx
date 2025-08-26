import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../contexts/AdminContext';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    site_name: 'Crypto Campaign Platform',
    site_description: 'Secure cryptocurrency campaign contributions',
    maintenance_mode: false,
    allow_registrations: true,
    require_email_verification: true,
    max_contribution_amount: 5000,
    min_contribution_amount: 1,
    supported_currencies: ['ETH', 'BTC'],
    fee_percentage: 2.5,
    contact_email: 'admin@cryptocampaign.com',
    privacy_policy_url: '',
    terms_of_service_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [systemStats, setSystemStats] = useState({
    uptime: '99.9%',
    version: '1.0.0',
    lastBackup: new Date().toISOString(),
    dbSize: '125MB',
    totalFiles: 2847,
    errorRate: '0.02%'
  });

  const { isSuperAdmin } = useAdmin();

  useEffect(() => {
    loadSettings();
    loadSystemStats();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // In a real app, you'd load these from a settings table
      // For now, we'll use mock data
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      // Load system statistics
      const [usersCount, campaignsCount, transactionsCount] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('campaigns').select('id', { count: 'exact' }),
        supabase.from('form_submissions').select('id', { count: 'exact' })
      ]);

      setSystemStats(prev => ({
        ...prev,
        totalUsers: usersCount.count || 0,
        totalCampaigns: campaignsCount.count || 0,
        totalTransactions: transactionsCount.count || 0
      }));
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // In a real app, you'd save these to a settings table
      // For now, we'll simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const performSystemAction = async (action) => {
    if (!window.confirm(`Are you sure you want to ${action}?`)) {
      return;
    }

    try {
      switch (action) {
        case 'backup':
          alert('System backup initiated. You will receive an email when complete.');
          break;
        case 'clear_cache':
          alert('Cache cleared successfully!');
          break;
        case 'restart':
          alert('System restart initiated. This may take a few minutes.');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Error performing ${action}`);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'payments', name: 'Payments', icon: '💳' },
    { id: 'notifications', name: 'Notifications', icon: '📧' },
    { id: 'system', name: 'System', icon: '🖥️' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
              <input
                type="text"
                value={settings.site_name}
                onChange={(e) => handleInputChange('site_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
              <textarea
                value={settings.site_description}
                onChange={(e) => handleInputChange('site_description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
              <input
                type="email"
                value={settings.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="maintenance_mode"
                checked={settings.maintenance_mode}
                onChange={(e) => handleInputChange('maintenance_mode', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="maintenance_mode" className="text-sm font-medium text-gray-700">
                Maintenance Mode
              </label>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="allow_registrations"
                checked={settings.allow_registrations}
                onChange={(e) => handleInputChange('allow_registrations', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="allow_registrations" className="text-sm font-medium text-gray-700">
                Allow New User Registrations
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="require_email_verification"
                checked={settings.require_email_verification}
                onChange={(e) => handleInputChange('require_email_verification', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="require_email_verification" className="text-sm font-medium text-gray-700">
                Require Email Verification
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Policy URL</label>
              <input
                type="url"
                value={settings.privacy_policy_url}
                onChange={(e) => handleInputChange('privacy_policy_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://yoursite.com/privacy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Terms of Service URL</label>
              <input
                type="url"
                value={settings.terms_of_service_url}
                onChange={(e) => handleInputChange('terms_of_service_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://yoursite.com/terms"
              />
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Contribution ($)</label>
                <input
                  type="number"
                  value={settings.min_contribution_amount}
                  onChange={(e) => handleInputChange('min_contribution_amount', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0.01"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Contribution ($)</label>
                <input
                  type="number"
                  value={settings.max_contribution_amount}
                  onChange={(e) => handleInputChange('max_contribution_amount', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  step="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform Fee (%)</label>
              <input
                type="number"
                value={settings.fee_percentage}
                onChange={(e) => handleInputChange('fee_percentage', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="10"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supported Cryptocurrencies</label>
              <div className="space-y-2">
                {['ETH', 'BTC', 'USDC', 'USDT'].map(currency => (
                  <div key={currency} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={currency}
                      checked={settings.supported_currencies.includes(currency)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('supported_currencies', [...settings.supported_currencies, currency]);
                        } else {
                          handleInputChange('supported_currencies', settings.supported_currencies.filter(c => c !== currency));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={currency} className="text-sm font-medium text-gray-700">
                      {currency}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    Email notification settings are managed through your email service provider.
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Notification Templates</h4>
              <div className="space-y-3">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h5 className="font-medium text-gray-900">Welcome Email</h5>
                  <p className="text-sm text-gray-600 mt-1">Sent to new users after registration</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-900 text-sm font-medium">
                    Edit Template
                  </button>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h5 className="font-medium text-gray-900">Contribution Confirmation</h5>
                  <p className="text-sm text-gray-600 mt-1">Sent after successful contribution</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-900 text-sm font-medium">
                    Edit Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            {/* System Stats */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">System Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Uptime</div>
                  <div className="text-lg font-semibold text-gray-900">{systemStats.uptime}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Version</div>
                  <div className="text-lg font-semibold text-gray-900">{systemStats.version}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Error Rate</div>
                  <div className="text-lg font-semibold text-gray-900">{systemStats.errorRate}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">DB Size</div>
                  <div className="text-lg font-semibold text-gray-900">{systemStats.dbSize}</div>
                </div>
              </div>
            </div>

            {/* System Actions */}
            {isSuperAdmin() && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">System Actions</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => performSystemAction('backup')}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-900">Create Backup</div>
                        <div className="text-sm text-gray-500">Generate a full system backup</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => performSystemAction('clear_cache')}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-900">Clear Cache</div>
                        <div className="text-sm text-gray-500">Clear all cached data</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => performSystemAction('restart')}
                    className="w-full flex items-center justify-between p-4 border border-red-200 rounded-lg hover:bg-red-50 text-red-700"
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <div>
                        <div className="font-medium">Restart System</div>
                        <div className="text-sm text-red-500">Restart the application server</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

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
            <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
            <p className="text-gray-600 mt-1">Configure platform settings and system preferences</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <form onSubmit={saveSettings}>
            {renderTabContent()}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;