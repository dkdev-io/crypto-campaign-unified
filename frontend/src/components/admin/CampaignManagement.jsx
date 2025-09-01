import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const CampaignManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    description: '',
    goal_amount: '',
    status: 'active',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is configured
      if (!supabase.from || typeof supabase.from !== 'function') {
        setCampaigns([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          description,
          goal_amount,
          raised_amount,
          status,
          start_date,
          end_date,
          created_at,
          updated_at,
          owner_id,
          users:owner_id(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setCampaigns([]); // Ensure campaigns is empty on error
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCampaignAction = async (campaignId, action) => {
    try {
      let updateData = {};
      
      switch (action) {
        case 'activate':
          updateData = { status: 'active', updated_at: new Date().toISOString() };
          break;
        case 'pause':
          updateData = { status: 'paused', updated_at: new Date().toISOString() };
          break;
        case 'complete':
          updateData = { status: 'completed', updated_at: new Date().toISOString() };
          break;
        case 'suspend':
          updateData = { status: 'suspended', updated_at: new Date().toISOString() };
          break;
        default:
          return;
      }

      const { error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', campaignId);

      if (error) throw error;
      
      await loadCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    
    try {
      const campaignData = {
        ...campaignFormData,
        goal_amount: parseFloat(campaignFormData.goal_amount) || 0,
        raised_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (currentCampaign) {
        const { error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', currentCampaign.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('campaigns')
          .insert(campaignData);
        
        if (error) throw error;
      }

      setShowCampaignModal(false);
      setCampaignFormData({
        name: '',
        description: '',
        goal_amount: '',
        status: 'active',
        start_date: '',
        end_date: ''
      });
      await loadCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const openCampaignModal = (campaign = null) => {
    if (campaign) {
      setCurrentCampaign(campaign);
      setCampaignFormData({
        name: campaign.name,
        description: campaign.description || '',
        goal_amount: campaign.goal_amount?.toString() || '',
        status: campaign.status,
        start_date: campaign.start_date || '',
        end_date: campaign.end_date || ''
      });
    } else {
      setCurrentCampaign(null);
      setCampaignFormData({
        name: '',
        description: '',
        goal_amount: '',
        status: 'active',
        start_date: '',
        end_date: ''
      });
    }
    setShowCampaignModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const CampaignModal = () => (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-card">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-foreground mb-4">
            {currentCampaign ? 'Edit Campaign' : 'Create New Campaign'}
          </h3>
          
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <label className="form-label">Campaign Name</label>
              <input
                type="text"
                value={campaignFormData.name}
                onChange={(e) => setCampaignFormData({...campaignFormData, name: e.target.value})}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label className="form-label">Description</label>
              <textarea
                value={campaignFormData.description}
                onChange={(e) => setCampaignFormData({...campaignFormData, description: e.target.value})}
                className="form-input"
                rows="3"
              />
            </div>
            
            <div>
              <label className="form-label">Goal Amount ($)</label>
              <input
                type="number"
                value={campaignFormData.goal_amount}
                onChange={(e) => setCampaignFormData({...campaignFormData, goal_amount: e.target.value})}
                className="form-input"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="form-label">Status</label>
              <select
                value={campaignFormData.status}
                onChange={(e) => setCampaignFormData({...campaignFormData, status: e.target.value})}
                className="form-input"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  value={campaignFormData.start_date}
                  onChange={(e) => setCampaignFormData({...campaignFormData, start_date: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  value={campaignFormData.end_date}
                  onChange={(e) => setCampaignFormData({...campaignFormData, end_date: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => setShowCampaignModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {currentCampaign ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
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
            <h2 className="text-2xl font-bold text-foreground">Campaign Management</h2>
            <p className="text-muted-foreground mt-1">Create, monitor, and manage all campaigns</p>
          </div>
          <button
            onClick={() => openCampaignModal()}
            className="btn-primary"
          >
            Create Campaign
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="crypto-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign) => {
          const progressPercentage = campaign.goal_amount > 0 
            ? Math.min((campaign.raised_amount / campaign.goal_amount) * 100, 100)
            : 0;

          return (
            <div key={campaign.id} className="crypto-card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">{campaign.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{progressPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-foreground mt-1">
                  <span>{formatCurrency(campaign.raised_amount)}</span>
                  <span>{formatCurrency(campaign.goal_amount)}</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground mb-4">
                <div>Start: {formatDate(campaign.start_date)}</div>
                <div>End: {formatDate(campaign.end_date)}</div>
                <div>Created: {formatDate(campaign.created_at)}</div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => openCampaignModal(campaign)}
                  className="text-primary hover:text-primary/90 text-sm font-medium"
                >
                  Edit
                </button>
                
                <div className="flex space-x-2">
                  {campaign.status === 'active' && (
                    <button
                      onClick={() => handleCampaignAction(campaign.id, 'pause')}
                      className="text-accent hover:text-accent/90 text-sm font-medium"
                    >
                      Pause
                    </button>
                  )}
                  {campaign.status === 'paused' && (
                    <button
                      onClick={() => handleCampaignAction(campaign.id, 'activate')}
                      className="text-green-600 hover:text-green-900 text-sm font-medium"
                    >
                      Activate
                    </button>
                  )}
                  {(campaign.status === 'active' || campaign.status === 'paused') && (
                    <button
                      onClick={() => handleCampaignAction(campaign.id, 'complete')}
                      className="text-primary hover:text-primary/90 text-sm font-medium"
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => handleCampaignAction(campaign.id, 'suspend')}
                    className="text-destructive hover:text-destructive/90 text-sm font-medium"
                  >
                    Suspend
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="crypto-card">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredCampaigns.length} of {campaigns.length} campaigns
          </div>
          <div className="text-sm font-medium text-foreground">
            Total Goal: {formatCurrency(filteredCampaigns.reduce((sum, c) => sum + (c.goal_amount || 0), 0))}
          </div>
        </div>
      </div>

      {showCampaignModal && <CampaignModal />}
    </div>
  );
};

export default CampaignManagement;