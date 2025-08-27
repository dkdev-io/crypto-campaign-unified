import React, { useState, useEffect } from 'react';
import { fecAPI } from '../../lib/fec-api.js';

const CommitteeManager = () => {
  const [testCommittees, setTestCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCommittee, setNewCommittee] = useState({
    name: '',
    purpose: '',
    adminEmail: 'admin@example.com'
  });

  useEffect(() => {
    loadTestCommittees();
  }, []);

  const loadTestCommittees = async () => {
    try {
      setLoading(true);
      const committees = await fecAPI.getTestCommittees();
      setTestCommittees(committees);
      setError('');
    } catch (err) {
      setError('Failed to load test committees: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCommittee = async (e) => {
    e.preventDefault();
    
    if (!newCommittee.name.trim()) {
      setError('Committee name is required');
      return;
    }

    try {
      setLoading(true);
      const result = await fecAPI.addTestCommittee(
        newCommittee.name,
        newCommittee.purpose || 'Testing purposes',
        newCommittee.adminEmail
      );

      setSuccess(`Test committee "${result.committee.name}" added successfully`);
      setNewCommittee({ name: '', purpose: '', adminEmail: 'admin@example.com' });
      setShowAddForm(false);
      await loadTestCommittees();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError('Failed to add committee: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="crypto-card text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          FEC Committee Manager
        </h1>
        <p className="text-muted-foreground">
          Manage test committees for development and testing purposes
        </p>
      </div>

      {/* Navigation */}
      <div className="crypto-card text-center">
        <div className="flex justify-center space-x-4">
          <a 
            href="/"
            className="btn-primary"
          >
            ← Back to Setup
          </a>
          <a 
            href="/admin"
            className="btn-secondary"
          >
            Campaign Admin
          </a>
          <a 
            href="/fec-test"
            className="btn-secondary"
          >
            Test FEC API
          </a>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="crypto-card bg-destructive/10 border-destructive/20 text-destructive">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="crypto-card bg-green-50 border-green-200 text-green-800">
          ✅ {success}
        </div>
      )}

      {/* Add Committee Section */}
      <div className="crypto-card bg-secondary">
        <div className={`flex justify-between items-center ${showAddForm ? 'mb-4' : ''}`}>
          <h3 className="text-lg font-semibold text-foreground">Add Test Committee</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={showAddForm ? 'bg-destructive text-destructive-foreground btn-secondary' : 'btn-secondary'}
          >
            {showAddForm ? '✕ Cancel' : '+ Add Committee'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddCommittee} className="mt-4 space-y-4">
            <div>
              <label className="form-label">
                Committee Name *
              </label>
              <input
                type="text"
                value={newCommittee.name}
                onChange={(e) => setNewCommittee({ ...newCommittee, name: e.target.value })}
                placeholder="e.g., Test Campaign Committee 2024"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">
                Test Purpose
              </label>
              <input
                type="text"
                value={newCommittee.purpose}
                onChange={(e) => setNewCommittee({ ...newCommittee, purpose: e.target.value })}
                placeholder="e.g., UI testing, Development testing"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">
                Admin Email
              </label>
              <input
                type="email"
                value={newCommittee.adminEmail}
                onChange={(e) => setNewCommittee({ ...newCommittee, adminEmail: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? '⏳ Adding...' : '✅ Add Committee'}
            </button>
          </form>
        )}
      </div>

      {/* Test Committees List */}
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e9ecef' }}>
        <div style={{ 
          padding: '1.5rem', 
          borderBottom: '1px solid #e9ecef',
          background: '#f8f9fa',
          borderRadius: '8px 8px 0 0'
        }}>
          <h3 style={{ margin: 0, color: '#495057' }}>
            Test Committees ({testCommittees.length})
          </h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#6c757d', fontSize: '14px' }}>
            These committees are available for testing the campaign setup flow
          </p>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {loading && testCommittees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
              ⏳ Loading test committees...
            </div>
          ) : testCommittees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
              <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🗳️</div>
              <p style={{ margin: 0, fontSize: '16px' }}>No test committees found</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px' }}>
                Add a test committee above to get started
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {testCommittees.map(committee => (
                <div 
                  key={committee.id}
                  style={{
                    border: '1px solid #e9ecef',
                    borderRadius: '6px',
                    padding: '1rem',
                    background: '#fafbfc'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        margin: '0 0 0.5rem 0', 
                        color: '#2a2a72',
                        fontSize: '16px'
                      }}>
                        🏛️ {committee.name}
                      </h4>
                      
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ 
                          background: '#e3f2fd', 
                          color: '#1565c0', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          TEST COMMITTEE
                        </span>
                      </div>

                      <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '0.5rem' }}>
                        <strong>ID:</strong> {committee.id}
                      </div>

                      {committee.testPurpose && (
                        <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '0.5rem' }}>
                          <strong>Purpose:</strong> {committee.testPurpose}
                        </div>
                      )}

                      <div style={{ fontSize: '12px', color: '#868e96' }}>
                        Added by {committee.addedBy} • {formatDate(committee.createdAt)}
                      </div>
                    </div>

                    <div style={{ marginLeft: '1rem' }}>
                      <span style={{ 
                        color: '#28a745', 
                        fontSize: '12px',
                        background: '#d4edda',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        ✅ ACTIVE
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1.5rem', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ color: '#495057', marginTop: 0 }}>📋 Usage Instructions</h4>
        <ul style={{ color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
          <li>Test committees appear in the committee search during campaign setup</li>
          <li>They can be selected just like real FEC committees</li>
          <li>Use descriptive names to identify different test scenarios</li>
          <li>Test committees are prefixed with "TEST_" in their ID</li>
          <li>All test committees are marked as active by default</li>
        </ul>
      </div>

      {/* Development Info */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#fff3cd', 
        borderRadius: '6px',
        border: '1px solid #ffeaa7',
        fontSize: '13px',
        color: '#856404'
      }}>
        <strong>🔧 Development Note:</strong> These test committees are stored separately from real FEC data 
        and are only used for development and testing purposes.
      </div>
    </div>
  );
};

export default CommitteeManager;