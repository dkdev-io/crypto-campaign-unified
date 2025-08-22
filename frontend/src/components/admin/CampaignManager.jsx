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
      // Parse the amounts string into an array of numbers
      const amounts = editAmounts
        .split(',')
        .map(a => parseFloat(a.trim()))
        .filter(a => !isNaN(a) && a > 0);

      if (amounts.length === 0) {
        alert('Please enter valid amounts (e.g., "25, 50, 100, 250")');
        return;
      }

      console.log(`💾 Saving amounts for campaign ${campaignId}:`, amounts);

      const { data, error } = await supabase
        .from('campaigns')
        .update({ suggested_amounts: amounts })
        .eq('id', campaignId)
        .select()
        .single();

      if (error) {
        alert(`Failed to update amounts: ${error.message}`);
      } else {
        console.log(`✅ Updated amounts successfully:`, data.suggested_amounts);
        // Update local state
        setCampaigns(prev => prev.map(c => 
          c.id === campaignId 
            ? { ...c, suggested_amounts: amounts }
            : c
        ));
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
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) {
        alert(`Failed to delete campaign: ${error.message}`);
      } else {
        setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        alert(`✅ Deleted "${campaignName}"`);
      }
    } catch (err) {
      alert(`Error deleting campaign: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading campaigns...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={loadCampaigns} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>🔧 Campaign Manager</h1>
        <div>
          <button 
            onClick={loadCampaigns}
            style={{ 
              padding: '0.5rem 1rem', 
              marginRight: '1rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
          <a 
            href="/" 
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            ← Back to Setup
          </a>
        </div>
      </div>

      <p style={{ marginBottom: '2rem', color: '#666' }}>
        📊 Total Campaigns: <strong>{campaigns.length}</strong>
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Campaign</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Suggested Amounts</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Max Donation</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Created</th>
              <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign, index) => (
              <tr key={campaign.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '1rem' }}>
                  <div>
                    <strong>{campaign.campaign_name}</strong>
                    <br />
                    <small style={{ color: '#666' }}>
                      <a 
                        href={`http://localhost:5173/?campaign=${campaign.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#007bff' }}
                      >
                        🔗 View Form
                      </a>
                    </small>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <small>{campaign.email}</small>
                </td>
                <td style={{ padding: '1rem' }}>
                  {editingCampaign === campaign.id ? (
                    <div>
                      <input
                        type="text"
                        value={editAmounts}
                        onChange={(e) => setEditAmounts(e.target.value)}
                        placeholder="Enter new amounts (e.g., 10, 25, 100)"
                        style={{ 
                          width: '150px', 
                          padding: '0.25rem', 
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                      <div style={{ marginTop: '0.5rem' }}>
                        <button
                          onClick={() => saveAmounts(campaign.id)}
                          style={{ 
                            padding: '0.25rem 0.5rem', 
                            marginRight: '0.5rem',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✅ Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{ 
                            padding: '0.25rem 0.5rem',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <strong>[{campaign.suggested_amounts?.join(', ') || 'none'}]</strong>
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  ${campaign.max_donation_limit || 3300}
                </td>
                <td style={{ padding: '1rem' }}>
                  <small>{new Date(campaign.created_at).toLocaleDateString()}</small>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {editingCampaign === campaign.id ? null : (
                    <div>
                      <button
                        onClick={() => startEdit(campaign)}
                        style={{ 
                          padding: '0.25rem 0.5rem', 
                          marginRight: '0.5rem',
                          background: '#ffc107',
                          color: 'black',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteCampaign(campaign.id, campaign.campaign_name)}
                        style={{ 
                          padding: '0.25rem 0.5rem',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
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

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
        <h3>💡 Usage Tips:</h3>
        <ul>
          <li>✏️ <strong>Edit Amounts:</strong> Click "Edit" to modify suggested donation amounts</li>
          <li>🔗 <strong>Test Campaigns:</strong> Click "View Form" to see the live donation form</li>
          <li>🗑️ <strong>Delete Campaigns:</strong> Remove test campaigns you no longer need</li>
          <li>💰 <strong>Amount Format:</strong> Enter amounts as "25, 50, 100, 250" (comma-separated)</li>
        </ul>
      </div>
    </div>
  );
};

export default CampaignManager;