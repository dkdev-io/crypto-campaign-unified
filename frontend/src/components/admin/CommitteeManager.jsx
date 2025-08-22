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
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#2a2a72', marginBottom: '0.5rem' }}>
          🏛️ FEC Committee Manager
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Manage test committees for development and testing purposes
        </p>
      </div>

      {/* Navigation */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <a 
          href="/"
          style={{ 
            marginRight: '1rem',
            color: '#2a2a72', 
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            border: '1px solid #2a2a72',
            borderRadius: '4px',
            display: 'inline-block'
          }}
        >
          ← Back to Setup
        </a>
        <a 
          href="/admin"
          style={{ 
            marginRight: '1rem',
            color: '#666', 
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            display: 'inline-block'
          }}
        >
          📊 Campaign Admin
        </a>
        <a 
          href="/fec-test"
          style={{ 
            color: '#28a745', 
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            border: '1px solid #28a745',
            borderRadius: '4px',
            display: 'inline-block'
          }}
        >
          🔬 Test FEC API
        </a>
      </div>

      {/* Status Messages */}
      {error && (
        <div style={{ 
          background: '#fee', 
          color: '#c33', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: '1px solid #fcc'
        }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{ 
          background: '#efe', 
          color: '#393', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: '1px solid #cfc'
        }}>
          ✅ {success}
        </div>
      )}

      {/* Add Committee Section */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: showAddForm ? '1rem' : '0'
        }}>
          <h3 style={{ margin: 0, color: '#495057' }}>Add Test Committee</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: showAddForm ? '#dc3545' : '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {showAddForm ? '✕ Cancel' : '+ Add Committee'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddCommittee} style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#495057'
              }}>
                Committee Name *
              </label>
              <input
                type="text"
                value={newCommittee.name}
                onChange={(e) => setNewCommittee({ ...newCommittee, name: e.target.value })}
                placeholder="e.g., Test Campaign Committee 2024"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#495057'
              }}>
                Test Purpose
              </label>
              <input
                type="text"
                value={newCommittee.purpose}
                onChange={(e) => setNewCommittee({ ...newCommittee, purpose: e.target.value })}
                placeholder="e.g., UI testing, Development testing"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#495057'
              }}>
                Admin Email
              </label>
              <input
                type="email"
                value={newCommittee.adminEmail}
                onChange={(e) => setNewCommittee({ ...newCommittee, adminEmail: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#2a2a72',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: loading ? 0.7 : 1
              }}
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