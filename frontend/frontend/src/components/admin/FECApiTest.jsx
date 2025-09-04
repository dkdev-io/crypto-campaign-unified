import React, { useState } from 'react';
import { fecAPI } from '../../lib/fec-api.js';
import FEC_CONFIG from '../../lib/fec-config.js';

const FECApiTest = () => {
  const [searchTerm, setSearchTerm] = useState('Biden');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState(
    FEC_CONFIG.API_KEY ? 'Configured' : 'Not configured'
  );

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
      alert(
        `Committee Details Retrieved:\n\nName: ${details?.name}\nType: ${details?.type}\nCity: ${details?.address?.city}, ${details?.address?.state}`
      );
    } catch (err) {
      console.error('Committee Details Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="crypto-card text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">🔬 FEC API Integration Test</h1>
        <p className="text-muted-foreground">Test FEC API connectivity and search functionality</p>
      </div>

      {/* Navigation */}
      <div className="crypto-card text-center">
        <div className="flex justify-center space-x-4">
          <a href="/committees" className="btn-primary">
            ← Committee Manager
          </a>
          <a href="/admin" className="btn-secondary">
            Campaign Admin
          </a>
        </div>
      </div>

      {/* API Key Status */}
      <div
        className={`crypto-card ${
          FEC_CONFIG.API_KEY
            ? 'bg-green-50 border-green-200'
            : 'bg-destructive/10 border-destructive/20'
        }`}
      >
        <h4
          className={`font-semibold mb-2 ${
            FEC_CONFIG.API_KEY ? 'text-green-800' : 'text-destructive'
          }`}
        >
          {FEC_CONFIG.API_KEY ? '✅ FEC API Key Status' : '❌ FEC API Key Status'}
        </h4>
        <div className="text-sm space-y-2">
          <div>
            <strong>Status:</strong> {apiKeyStatus}
          </div>
          {FEC_CONFIG.API_KEY && (
            <div>
              <strong>Key:</strong> {FEC_CONFIG.API_KEY.substring(0, 8)}...
              {FEC_CONFIG.API_KEY.substring(-4)}
            </div>
          )}
          <div>
            <strong>Base URL:</strong> {FEC_CONFIG.BASE_URL}
          </div>
        </div>
      </div>

      {/* Search Test */}
      <div className="crypto-card">
        <div className="bg-secondary p-4 border-b border-border rounded-t-lg">
          <h4 className="text-lg font-semibold text-foreground">🔍 Committee Search Test</h4>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter search term (e.g., Biden, Trump, Harris)"
              className="form-input flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              className="btn-primary min-w-[120px] disabled:opacity-50"
            >
              {loading ? '⏳ Searching...' : '🔍 Test Search'}
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleTestSpecificCommittee('C00401224')}
              disabled={loading}
              className="btn-secondary text-xs disabled:opacity-50"
            >
              Test Biden Committee
            </button>
            <button
              onClick={() => handleTestSpecificCommittee('C00618371')}
              disabled={loading}
              className="btn-secondary text-xs disabled:opacity-50"
            >
              Test Trump Committee
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="crypto-card bg-destructive/10 border-destructive/20 text-destructive">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="crypto-card">
          <div className="bg-secondary p-4 border-b border-border rounded-t-lg">
            <h4 className="text-lg font-semibold text-foreground">
              📊 Search Results ({results.total} found from {results.source})
            </h4>
          </div>

          <div className="p-4">
            {results.committees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No committees found for "{searchTerm}"
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-4">
                {results.committees.map((committee, index) => (
                  <div
                    key={committee.id}
                    className={`p-4 bg-secondary/30 rounded ${index < results.committees.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="text-base font-semibold text-foreground mb-2">
                          {results.source === 'fec' ? '🏛️' : '🧪'} {committee.name}
                        </h5>

                        <div className="mb-2 space-x-2">
                          <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-medium">
                            {FEC_CONFIG.COMMITTEE_TYPES[committee.type] || committee.type}
                          </span>

                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              results.source === 'fec'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-accent/20 text-accent-foreground'
                            }`}
                          >
                            {results.source === 'fec' ? 'FEC DATA' : 'TEST DATA'}
                          </span>
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            <strong>ID:</strong> {committee.id}
                          </div>
                          {committee.candidateName && (
                            <div>
                              <strong>Candidate:</strong> {committee.candidateName}
                            </div>
                          )}
                          {committee.city && committee.state && (
                            <div>
                              <strong>Location:</strong> {committee.city}, {committee.state}
                            </div>
                          )}
                          {committee.organizationType && (
                            <div>
                              <strong>Organization:</strong> {committee.organizationType}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-4">
                        <button
                          onClick={() => handleTestSpecificCommittee(committee.id)}
                          disabled={loading}
                          className="btn-primary text-xs disabled:opacity-50"
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
      <div className="crypto-card bg-secondary">
        <h4 className="text-lg font-medium text-foreground mb-4">📋 Test Instructions</h4>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside mb-4">
          <li>Search for committee names, candidate names, or committee IDs</li>
          <li>Try popular names like "Biden", "Trump", "Harris", "Senate", "House"</li>
          <li>Results will show FEC data if API key is working</li>
          <li>Click "Get Details" to test individual committee retrieval</li>
          <li>Check browser console for detailed API logs</li>
        </ul>

        <div className="crypto-card bg-accent/10 border-accent/20 text-accent-foreground">
          <div className="text-sm">
            <strong>🔧 Troubleshooting:</strong>
            <div className="mt-2">
              If you get CORS errors, the FEC API may need to be called from a backend server. For
              development, try searching for committees that exist in your local test data first.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FECApiTest;
