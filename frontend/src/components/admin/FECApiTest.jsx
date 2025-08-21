import React, { useState } from 'react';
import { fecAPI } from '../../lib/fec-api.js';
import FEC_CONFIG from '../../lib/fec-config.js';

const FECApiTest = () => {
  const [searchTerm, setSearchTerm] = useState('Biden');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState(FEC_CONFIG.API_KEY ? 'Configured' : 'Not configured');

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');
      setResults(null);

      console.log('Testing FEC API with search term:', searchTerm);
      const searchResults = await fecAPI.searchCommittees(searchTerm, 10);
      
      console.log('FEC API Results:', searchResults);
      setResults(searchResults);
      
    } catch (err) {
      console.error('FEC API Test Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSpecificCommittee = async (committeeId = 'C00401224') => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Testing committee details for:', committeeId);
      const details = await fecAPI.getCommitteeDetails(committeeId, 'fec');
      
      console.log('Committee Details:', details);
      alert(`Committee Details Retrieved:\n\nName: ${details?.name}\nType: ${details?.type}\nCity: ${details?.address?.city}, ${details?.address?.state}`);
      
    } catch (err) {
      console.error('Committee Details Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#2a2a72', marginBottom: '0.5rem' }}>
          🔬 FEC API Integration Test
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Test FEC API connectivity and search functionality
        </p>
      </div>

      {/* Navigation */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <a 
          href="/committees"
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
          ← Committee Manager
        </a>
        <a 
          href="/admin"
          style={{ 
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
      </div>

      {/* API Key Status */}
      <div style={{ 
        background: FEC_CONFIG.API_KEY ? '#d4edda' : '#f8d7da',
        border: `1px solid ${FEC_CONFIG.API_KEY ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '2rem'
      }}>
        <h4 style={{ 
          color: FEC_CONFIG.API_KEY ? '#155724' : '#721c24',
          margin: '0 0 0.5rem 0'
        }}>
          {FEC_CONFIG.API_KEY ? '✅ FEC API Key Status' : '❌ FEC API Key Status'}
        </h4>
        <div style={{ fontSize: '14px' }}>
          <strong>Status:</strong> {apiKeyStatus}
        </div>
        {FEC_CONFIG.API_KEY && (
          <div style={{ fontSize: '14px', marginTop: '0.5rem' }}>
            <strong>Key:</strong> {FEC_CONFIG.API_KEY.substring(0, 8)}...{FEC_CONFIG.API_KEY.substring(-4)}
          </div>
        )}
        <div style={{ fontSize: '14px', marginTop: '0.5rem' }}>
          <strong>Base URL:</strong> {FEC_CONFIG.BASE_URL}
        </div>
      </div>

      {/* Search Test */}
      <div style={{ 
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          background: '#f8f9fa',
          padding: '1rem',
          borderBottom: '1px solid #e9ecef',
          borderRadius: '8px 8px 0 0'
        }}>
          <h4 style={{ margin: 0, color: '#495057' }}>
            🔍 Committee Search Test
          </h4>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter search term (e.g., Biden, Trump, Harris)"
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              style={{
                background: '#2a2a72',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                minWidth: '120px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '⏳ Searching...' : '🔍 Test Search'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleTestSpecificCommittee('C00401224')}
              disabled={loading}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: loading ? 0.7 : 1
              }}
            >
              Test Biden Committee
            </button>
            <button
              onClick={() => handleTestSpecificCommittee('C00618371')}
              disabled={loading}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: loading ? 0.7 : 1
              }}
            >
              Test Trump Committee
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          background: '#f8d7da',
          color: '#721c24',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #f5c6cb'
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div style={{ 
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            background: '#f8f9fa',
            padding: '1rem',
            borderBottom: '1px solid #e9ecef',
            borderRadius: '8px 8px 0 0'
          }}>
            <h4 style={{ margin: 0, color: '#495057' }}>
              📊 Search Results ({results.total} found from {results.source})
            </h4>
          </div>
          
          <div style={{ padding: '1rem' }}>
            {results.committees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                No committees found for "{searchTerm}"
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {results.committees.map((committee, index) => (
                  <div 
                    key={committee.id}
                    style={{
                      padding: '1rem',
                      borderBottom: index < results.committees.length - 1 ? '1px solid #e9ecef' : 'none',
                      background: '#fafbfc'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h5 style={{ 
                          margin: '0 0 0.5rem 0', 
                          color: '#2a2a72',
                          fontSize: '16px'
                        }}>
                          {results.source === 'fec' ? '🏛️' : '🧪'} {committee.name}
                        </h5>
                        
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ 
                            background: '#e3f2fd', 
                            color: '#1565c0', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '12px',
                            fontWeight: '500',
                            marginRight: '0.5rem'
                          }}>
                            {FEC_CONFIG.COMMITTEE_TYPES[committee.type] || committee.type}
                          </span>
                          
                          <span style={{ 
                            background: results.source === 'fec' ? '#d4edda' : '#fff3cd', 
                            color: results.source === 'fec' ? '#155724' : '#856404', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {results.source === 'fec' ? 'FEC DATA' : 'TEST DATA'}
                          </span>
                        </div>

                        <div style={{ fontSize: '14px', color: '#6c757d' }}>
                          <div><strong>ID:</strong> {committee.id}</div>
                          {committee.candidateName && (
                            <div><strong>Candidate:</strong> {committee.candidateName}</div>
                          )}
                          {committee.city && committee.state && (
                            <div><strong>Location:</strong> {committee.city}, {committee.state}</div>
                          )}
                          {committee.organizationType && (
                            <div><strong>Organization:</strong> {committee.organizationType}</div>
                          )}
                        </div>
                      </div>

                      <div style={{ marginLeft: '1rem' }}>
                        <button
                          onClick={() => handleTestSpecificCommittee(committee.id)}
                          disabled={loading}
                          style={{
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            opacity: loading ? 0.7 : 1
                          }}
                        >
                          Get Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{ 
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '1.5rem'
      }}>
        <h4 style={{ color: '#495057', marginTop: 0 }}>📋 Test Instructions</h4>
        <ul style={{ color: '#6c757d', fontSize: '14px', lineHeight: '1.6', paddingLeft: '1.2rem' }}>
          <li>Search for committee names, candidate names, or committee IDs</li>
          <li>Try popular names like "Biden", "Trump", "Harris", "Senate", "House"</li>
          <li>Results will show FEC data if API key is working</li>
          <li>Click "Get Details" to test individual committee retrieval</li>
          <li>Check browser console for detailed API logs</li>
        </ul>
        
        <div style={{ 
          marginTop: '1rem',
          padding: '1rem',
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px'
        }}>
          <strong style={{ color: '#856404' }}>🔧 Troubleshooting:</strong>
          <div style={{ color: '#856404', fontSize: '14px', marginTop: '0.5rem' }}>
            If you get CORS errors, the FEC API may need to be called from a backend server.
            For development, try searching for committees that exist in your local test data first.
          </div>
        </div>
      </div>
    </div>
  );
};

export default FECApiTest;