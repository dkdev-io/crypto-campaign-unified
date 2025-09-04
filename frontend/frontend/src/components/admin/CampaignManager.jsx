import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const CampaignManager = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [editAmounts, setEditAmounts] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(`Failed to load campaigns: ${error.message}`);
      } else {
        setCampaigns(data);
        console.log(`✅ Loaded ${data.length} campaigns`);
      }
    } catch (err) {
      setError(`Error loading campaigns: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (campaign) => {
    setEditingCampaign(campaign.id);
    setEditAmounts(campaign.suggested_amounts?.join(', ') || '');
  };

  const cancelEdit = () => {
    setEditingCampaign(null);
    setEditAmounts('');
  };

  const saveAmounts = async (campaignId) => {
    try {
      const amounts = editAmounts
        .split(',')
        .map((a) => parseFloat(a.trim()))
        .filter((a) => !isNaN(a) && a > 0);

      if (amounts.length === 0) {
        alert('Please enter valid amounts (e.g., "25, 50, 100, 250")');
        return;
      }

      const { data, error } = await supabase
        .from('campaigns')
        .update({ suggested_amounts: amounts })
        .eq('id', campaignId)
        .select()
        .single();

      if (error) {
        alert(`Failed to update amounts: ${error.message}`);
      } else {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaignId ? { ...c, suggested_amounts: amounts } : c))
        );
        setEditingCampaign(null);
        setEditAmounts('');
        alert(`✅ Amounts updated to: [${amounts.join(', ')}]`);
      }
    } catch (err) {
      alert(`Error updating amounts: ${err.message}`);
    }
  };

  const deleteCampaign = async (campaignId, campaignName) => {
    if (!confirm(`Are you sure you want to delete "${campaignName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);

      if (error) {
        alert(`Failed to delete campaign: ${error.message}`);
      } else {
        setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
        alert(`✅ Deleted "${campaignName}"`);
      }
    } catch (err) {
      alert(`Error deleting campaign: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crypto-card text-center">
        <h2 className="text-xl font-bold text-foreground mb-4">Error</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button onClick={loadCampaigns} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="crypto-card">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Campaign Manager</h1>
            <p className="text-muted-foreground">Manage and configure campaigns</p>
          </div>
          <div className="flex gap-4">
            <button onClick={loadCampaigns} className="btn-secondary">
              🔄 Refresh
            </button>
            <a href="/" className="btn-primary">
              ← Back to Setup
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="crypto-card">
        <p className="text-muted-foreground">
          📊 Total Campaigns: <strong className="text-foreground">{campaigns.length}</strong>
        </p>
      </div>

      {/* Campaigns Table */}
      <div className="crypto-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Suggested Amounts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Max Donation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {campaign.campaign_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <a
                          href={`http://localhost:5173/?campaign=${campaign.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          🔗 View Form
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {campaign.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCampaign === campaign.id ? (
                      <div>
                        <input
                          type="text"
                          value={editAmounts}
                          onChange={(e) => setEditAmounts(e.target.value)}
                          placeholder="Enter new amounts (e.g., 10, 25, 100)"
                          className="form-input w-40"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => saveAmounts(campaign.id)}
                            className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs"
                          >
                            ✅ Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-foreground">
                        [{campaign.suggested_amounts?.join(', ') || 'none'}]
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    ${campaign.max_donation_limit || 3300}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {editingCampaign === campaign.id ? null : (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => startEdit(campaign)}
                          className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs hover:bg-accent/80"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteCampaign(campaign.id, campaign.campaign_name)}
                          className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs hover:bg-destructive/80"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="crypto-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">💡 Usage Tips:</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            ✏️ <strong>Edit Amounts:</strong> Click "Edit" to modify suggested donation amounts
          </li>
          <li>
            🔗 <strong>Test Campaigns:</strong> Click "View Form" to see the live donation form
          </li>
          <li>
            🗑️ <strong>Delete Campaigns:</strong> Remove test campaigns you no longer need
          </li>
          <li>
            💰 <strong>Amount Format:</strong> Enter amounts as "25, 50, 100, 250" (comma-separated)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CampaignManager;
