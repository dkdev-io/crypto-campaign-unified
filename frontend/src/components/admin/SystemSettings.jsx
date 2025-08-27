import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../contexts/AdminContext';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    site_name: '',
    site_description: '',
    maintenance_mode: false,
    allow_registrations: true,
    require_email_verification: true,
    max_contribution_amount: 0,
    min_contribution_amount: 0,
    supported_currencies: [],
    fee_percentage: 0,
    contact_email: '',
    privacy_policy_url: '',
    terms_of_service_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalCampaigns: 0,
    totalTransactions: 0
  });

  const { isSuperAdmin } = useAdmin();

  useEffect(() => {
    loadSettings();
    loadSystemStats();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load settings from database if settings table exists
      const { data: settingsData, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();
      
      if (settingsData && !error) {
        setSettings({
          site_name: settingsData.site_name || '',
          site_description: settingsData.site_description || '',
          maintenance_mode: settingsData.maintenance_mode || false,
          allow_registrations: settingsData.allow_registrations || true,
          require_email_verification: settingsData.require_email_verification || true,
          max_contribution_amount: settingsData.max_contribution_amount || 0,
          min_contribution_amount: settingsData.min_contribution_amount || 0,
          supported_currencies: settingsData.supported_currencies || [],
          fee_percentage: settingsData.fee_percentage || 0,
          contact_email: settingsData.contact_email || '',
          privacy_policy_url: settingsData.privacy_policy_url || '',
          terms_of_service_url: settingsData.terms_of_service_url || ''
        });
      }
      
      setLoading(false);
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
      // Save settings to database
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1, // Single row for settings
          site_name: settings.site_name,
          site_description: settings.site_description,
          maintenance_mode: settings.maintenance_mode,
          allow_registrations: settings.allow_registrations,
          require_email_verification: settings.require_email_verification,
          max_contribution_amount: settings.max_contribution_amount,
          min_contribution_amount: settings.min_contribution_amount,
          supported_currencies: settings.supported_currencies,
          fee_percentage: settings.fee_percentage,
          contact_email: settings.contact_email,
          privacy_policy_url: settings.privacy_policy_url,
          terms_of_service_url: settings.terms_of_service_url,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (error) {
        console.error('Database error:', error);
        alert('Error saving settings to database. Settings table may not exist yet.');
      } else {
        alert('Settings saved successfully!');
      }
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
      // Log system actions to database
      const { error } = await supabase
        .from('admin_logs')
        .insert({
          action,
          timestamp: new Date().toISOString(),
          user_id: 'current-admin-id' // Replace with actual admin ID
        });
      
      if (error) {
        console.error('Error logging system action:', error);
      }
      
      alert(`System action "${action}" logged successfully.`);
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
              <label className="form-label">Site Name</label>
              <input
                type="text"
                value={settings.site_name}
                onChange={(e) => handleInputChange('site_name', e.target.value)}
                className="form-input"
              />
            </div>
            
            <div>
              <label className="form-label">Site Description</label>
              <textarea
                value={settings.site_description}
                onChange={(e) => handleInputChange('site_description', e.target.value)}
                className="form-input"
                rows="3"
              />
            </div>
            
            <div>
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                value={settings.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="maintenance_mode"
                checked={settings.maintenance_mode}
                onChange={(e) => handleInputChange('maintenance_mode', e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="maintenance_mode" className="form-label">
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
                className="rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="allow_registrations" className="form-label">
                Allow New User Registrations
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="require_email_verification"
                checked={settings.require_email_verification}
                onChange={(e) => handleInputChange('require_email_verification', e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="require_email_verification" className="form-label">
                Require Email Verification
              </label>
            </div>

            <div>
              <label className="form-label">Privacy Policy URL</label>
              <input
                type="url"
                value={settings.privacy_policy_url}
                onChange={(e) => handleInputChange('privacy_policy_url', e.target.value)}
                className="form-input"
                placeholder="https://yoursite.com/privacy"
              />
            </div>

            <div>
              <label className="form-label">Terms of Service URL</label>
              <input
                type="url"
                value={settings.terms_of_service_url}
                onChange={(e) => handleInputChange('terms_of_service_url', e.target.value)}
                className="form-input"
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
                <label className="form-label">Minimum Contribution ($)</label>
                <input
                  type="number"
                  value={settings.min_contribution_amount}
                  onChange={(e) => handleInputChange('min_contribution_amount', parseFloat(e.target.value))}
                  className="form-input"
                  min="0.01"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="form-label">Maximum Contribution ($)</label>
                <input
                  type="number"
                  value={settings.max_contribution_amount}
                  onChange={(e) => handleInputChange('max_contribution_amount', parseFloat(e.target.value))}
                  className="form-input"
                  min="1"
                  step="1"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Platform Fee (%)</label>
              <input
                type="number"
                value={settings.fee_percentage}
                onChange={(e) => handleInputChange('fee_percentage', parseFloat(e.target.value))}
                className="form-input"
                min="0"
                max="10"
                step="0.1"
              />
            </div>

            <div>
              <label className="form-label">Supported Cryptocurrencies</label>
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
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor={currency} className="form-label">
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
            <div className="bg-secondary border border-border rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-accent">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-foreground">
                    Email notification settings are managed through your email service provider.
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-foreground mb-4">Notification Templates</h4>
              <div className="space-y-3">
                <div className="p-4 border border-border rounded-lg">
                  <h5 className="font-medium text-foreground">Welcome Email</h5>
                  <p className="text-sm text-muted-foreground mt-1">Sent to new users after registration</p>
                  <button className="mt-2 text-primary hover:text-primary/90 text-sm font-medium">
                    Edit Template
                  </button>
                </div>
                
                <div className="p-4 border border-border rounded-lg">
                  <h5 className="font-medium text-foreground">Contribution Confirmation</h5>
                  <p className="text-sm text-muted-foreground mt-1">Sent after successful contribution</p>
                  <button className="mt-2 text-primary hover:text-primary/90 text-sm font-medium">
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
              <h4 className="text-lg font-medium text-foreground mb-4">Database Statistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-secondary p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Users</div>
                  <div className="text-lg font-semibold text-foreground">{systemStats.totalUsers || 0}</div>
                </div>
                <div className="bg-secondary p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Campaigns</div>
                  <div className="text-lg font-semibold text-foreground">{systemStats.totalCampaigns || 0}</div>
                </div>
                <div className="bg-secondary p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Transactions</div>
                  <div className="text-lg font-semibold text-foreground">{systemStats.totalTransactions || 0}</div>
                </div>
              </div>
            </div>

            {/* System Actions */}
            {isSuperAdmin() && (
              <div>
                <h4 className="text-lg font-medium text-foreground mb-4">System Actions</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => performSystemAction('backup')}
                    className="w-full flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary"
                  >
                    <div className="flex items-center">
                      <span className="mr-3 text-primary">💾</span>
                      <div>
                        <div className="font-medium text-foreground">Create Backup</div>
                        <div className="text-sm text-muted-foreground">Generate a full system backup</div>
                      </div>
                    </div>
                    <span className="text-muted-foreground">→</span>
                  </button>

                  <button
                    onClick={() => performSystemAction('clear_cache')}
                    className="w-full flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary"
                  >
                    <div className="flex items-center">
                      <span className="mr-3 text-accent">🗑️</span>
                      <div>
                        <div className="font-medium text-foreground">Clear Cache</div>
                        <div className="text-sm text-muted-foreground">Clear all cached data</div>
                      </div>
                    </div>
                    <span className="text-muted-foreground">→</span>
                  </button>

                  <button
                    onClick={() => performSystemAction('restart')}
                    className="w-full flex items-center justify-between p-4 border border-destructive/20 rounded-lg hover:bg-destructive/10 text-destructive"
                  >
                    <div className="flex items-center">
                      <span className="mr-3 text-destructive">🔄</span>
                      <div>
                        <div className="font-medium">Restart System</div>
                        <div className="text-sm text-destructive/70">Restart the application server</div>
                      </div>
                    </div>
                    <span className="text-destructive/70">→</span>
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
            <h2 className="text-2xl font-bold text-foreground">System Settings</h2>
            <p className="text-muted-foreground mt-1">Configure platform settings and system preferences</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="crypto-card">
        <div className="border-b border-border">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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