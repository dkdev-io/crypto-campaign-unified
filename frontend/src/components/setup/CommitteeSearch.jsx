import React, { useState, useEffect } from 'react';
import { fecAPI } from '../../lib/fec-api.js';
import { supabase } from '../../lib/supabase';

const CommitteeSearch = ({ formData, updateFormData, onNext, onPrev }) => {
  const [searchTerm, setSearchTerm] = useState(formData.committeeNameSearch || '');
  const [committees, setCommittees] = useState([]);
  const [selectedCommittee, setSelectedCommittee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [validation, setValidation] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCommittee, setManualCommittee] = useState({
    name: '',
    id: '',
    type: 'N',
    candidateName: '',
    city: '',
    state: ''
  });

  // Auto-search on component mount if we have a search term
  useEffect(() => {
    if (formData.committeeNameSearch && !searched) {
      handleSearch(formData.committeeNameSearch);
    }
  }, []);

  const handleSearch = async (term = searchTerm) => {
    if (!term.trim()) {
      setError('Please enter a committee name or search term');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSearched(true);
      
      const result = await fecAPI.searchCommittees(term.trim(), 20);
      setCommittees(result.committees);
      
      if (result.committees.length === 0) {
        setError(`No committees found for "${term}". Try different keywords or contact admin to add a test committee.`);
      }

    } catch (err) {
      console.warn('FEC API search failed:', err.message);
      setError('FEC API search temporarily unavailable. You can enter committee information manually below.');
      setCommittees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCommittee = async (committee) => {
    try {
      setLoading(true);
      setSelectedCommittee(committee);
      
      // Get detailed committee information
      let details;
      if (committee.source === 'test') {
        details = {
          id: committee.id,
          name: committee.name,
          type: 'TEST',
          source: 'test',
          isActive: true,
          address: {
            street1: '123 Test Street',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345'
          },
          contacts: {
            treasurerName: 'Test Treasurer'
          }
        };
      } else {
        details = await fecAPI.getCommitteeDetails(committee.id, committee.source);
      }
      
      // Validate committee for ActBlue requirements
      const validation = fecAPI.validateCommitteeForActBlue(details);
      setValidation(validation);
      
      // Update form data
      updateFormData({
        selectedCommittee: committee,
        committeeDetails: details,
        fecCommitteeId: details.id,
        committeeName: details.name,
        committeeValidation: validation
      });

    } catch (err) {
      setError('Failed to get committee details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCommittee = () => {
    if (!selectedCommittee) {
      setError('Please select a committee first');
      return;
    }

    if (validation && !validation.isValid) {
      setError('Selected committee has validation errors that must be resolved');
      return;
    }

    onNext();
  };

  const logBypassUsage = async () => {
    try {
      // Try to create the table first if RPC function exists
      try {
        await supabase.rpc('create_error_logs_table_if_not_exists');
      } catch (rpcError) {
        console.log('RPC function not available, table should be created manually');
      }
      
      // Log the bypass event - will fail gracefully if table doesn't exist
      const logData = {
        error_type: 'FEC_API_BYPASS',
        error_message: 'User bypassed FEC API search due to unavailability',
        user_agent: navigator.userAgent,
        url: window.location.href,
        search_term: searchTerm,
        timestamp: new Date().toISOString()
      };
      
      const { error: logError } = await supabase
        .from('error_logs')
        .insert([logData]);
        
      if (logError) {
        // If table doesn't exist, log to console instead
        console.log('FEC API Bypass logged locally:', logData);
        console.warn('Could not log to database (table may not exist):', logError.message);
      } else {
        console.log('Bypass usage logged to database successfully');
      }
    } catch (err) {
      console.warn('Error logging bypass usage:', err);
    }
  };

  const handleManualCommitteeSubmit = () => {
    if (!manualCommittee.name.trim()) {
      setError('Committee name is required');
      return;
    }
    
    const testCommittee = {
      id: manualCommittee.id || 'MANUAL-' + Date.now(),
      name: manualCommittee.name,
      type: manualCommittee.type,
      source: 'manual',
      candidateName: manualCommittee.candidateName,
      city: manualCommittee.city,
      state: manualCommittee.state
    };
    
    handleSelectCommittee(testCommittee);
  };

  const formatCommitteeType = (type) => {
    const types = {
      'P': 'Presidential',
      'H': 'House',
      'S': 'Senate', 
      'N': 'PAC',
      'Q': 'Qualified Non-Profit',
      'TEST': 'Test Committee'
    };
    return types[type] || type;
  };

  return (
    <div>
      <h2 style={{ color: '#2a2a72', textAlign: 'center', marginBottom: '1rem' }}>
        🔍 Find Your Committee - Step 2
      </h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
        Search for your FEC committee to complete registration
      </p>

      {/* Search Section */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid #e9ecef'
      }}>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label>Search for Committee</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="form-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter committee name or keywords..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{ flex: 1 }}
            />
            <button 
              onClick={() => handleSearch()}
              disabled={loading || !searchTerm.trim()}
              style={{
                background: '#2a2a72',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                minWidth: '100px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '⏳' : '🔍 Search'}
            </button>
          </div>
        </div>

        {searched && (
          <div style={{ fontSize: '14px', color: '#6c757d' }}>
            Searching: "{searchTerm}" • Found {committees.length} result{committees.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Error Message with Bypass Option */}
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
          {error.includes('temporarily unavailable') && (
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={() => {
                  setShowManualEntry(true);
                  setError('');
                  // Log the bypass usage
                  logBypassUsage();
                }}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📝 Skip Search - Enter Manually
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Committee Entry Form */}
      {showManualEntry && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          marginBottom: '2rem',
          border: '1px solid #e9ecef'
        }}>
          <h4 style={{ color: '#495057', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            📝 Manual Committee Entry
            <button
              onClick={() => setShowManualEntry(false)}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#6c757d'
              }}
            >
              ✕
            </button>
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Committee Name *</label>
              <input
                className="form-input"
                type="text"
                value={manualCommittee.name}
                onChange={(e) => setManualCommittee({...manualCommittee, name: e.target.value})}
                placeholder="Enter committee name"
              />
            </div>
            
            <div className="form-group">
              <label>Committee ID</label>
              <input
                className="form-input"
                type="text"
                value={manualCommittee.id}
                onChange={(e) => setManualCommittee({...manualCommittee, id: e.target.value})}
                placeholder="FEC ID (optional)"
              />
            </div>
            
            <div className="form-group">
              <label>Committee Type</label>
              <select
                className="form-input"
                value={manualCommittee.type}
                onChange={(e) => setManualCommittee({...manualCommittee, type: e.target.value})}
              >
                <option value="N">PAC</option>
                <option value="P">Presidential</option>
                <option value="H">House</option>
                <option value="S">Senate</option>
                <option value="Q">Qualified Non-Profit</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Candidate Name</label>
              <input
                className="form-input"
                type="text"
                value={manualCommittee.candidateName}
                onChange={(e) => setManualCommittee({...manualCommittee, candidateName: e.target.value})}
                placeholder="Candidate name (if applicable)"
              />
            </div>
            
            <div className="form-group">
              <label>City</label>
              <input
                className="form-input"
                type="text"
                value={manualCommittee.city}
                onChange={(e) => setManualCommittee({...manualCommittee, city: e.target.value})}
                placeholder="City"
              />
            </div>
            
            <div className="form-group">
              <label>State</label>
              <input
                className="form-input"
                type="text"
                value={manualCommittee.state}
                onChange={(e) => setManualCommittee({...manualCommittee, state: e.target.value})}
                placeholder="State"
                maxLength="2"
              />
            </div>
          </div>
          
          <button
            onClick={handleManualCommitteeSubmit}
            style={{
              background: '#2a2a72',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ✓ Use This Committee
          </button>
        </div>
      )}

      {/* Committee Results */}
      {committees.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: '#495057', marginBottom: '1rem' }}>
            Select Your Committee ({committees.length} found)
          </h4>
          
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            border: '1px solid #e9ecef',
            borderRadius: '6px'
          }}>
            {committees.map((committee, index) => (
              <div
                key={committee.id}
                onClick={() => handleSelectCommittee(committee)}
                style={{
                  padding: '1rem',
                  borderBottom: index < committees.length - 1 ? '1px solid #e9ecef' : 'none',
                  cursor: 'pointer',
                  background: selectedCommittee?.id === committee.id ? '#e3f2fd' : 'white',
                  borderLeft: selectedCommittee?.id === committee.id ? '4px solid #2a2a72' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (selectedCommittee?.id !== committee.id) {
                    e.target.style.background = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCommittee?.id !== committee.id) {
                    e.target.style.background = 'white';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ 
                      margin: '0 0 0.5rem 0', 
                      color: '#2a2a72',
                      fontSize: '16px'
                    }}>
                      {committee.source === 'test' ? '🧪' : '🏛️'} {committee.name}
                    </h5>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ 
                        background: committee.source === 'test' ? '#fff3cd' : '#e3f2fd', 
                        color: committee.source === 'test' ? '#856404' : '#1565c0', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        fontWeight: '500',
                        marginRight: '0.5rem'
                      }}>
                        {formatCommitteeType(committee.type)}
                      </span>
                      
                      {committee.source === 'test' && (
                        <span style={{ 
                          background: '#d4edda', 
                          color: '#155724', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          TEST COMMITTEE
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '14px', color: '#6c757d' }}>
                      <div><strong>ID:</strong> {committee.id}</div>
                      {committee.candidateName && (
                        <div><strong>Candidate:</strong> {committee.candidateName}</div>
                      )}
                      {committee.city && committee.state && (
                        <div><strong>Location:</strong> {committee.city}, {committee.state}</div>
                      )}
                      {committee.source === 'test' && committee.testPurpose && (
                        <div><strong>Test Purpose:</strong> {committee.testPurpose}</div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginLeft: '1rem' }}>
                    {selectedCommittee?.id === committee.id ? (
                      <span style={{ 
                        color: '#2a2a72', 
                        fontSize: '20px',
                        fontWeight: 'bold'
                      }}>
                        ✓ SELECTED
                      </span>
                    ) : (
                      <span style={{ color: '#6c757d', fontSize: '14px' }}>
                        Click to select
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Committee Validation */}
      {selectedCommittee && validation && (
        <div style={{ 
          background: validation.isValid ? '#d4edda' : '#f8d7da',
          border: `1px solid ${validation.isValid ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '6px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <h5 style={{ 
            color: validation.isValid ? '#155724' : '#721c24',
            margin: '0 0 1rem 0'
          }}>
            {validation.isValid ? '✅ Committee Validation Passed' : '⚠️ Committee Validation Issues'}
          </h5>

          {validation.errors.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: '#721c24' }}>Errors:</strong>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', color: '#721c24' }}>
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: '#856404' }}>Warnings:</strong>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', color: '#856404' }}>
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ fontSize: '14px' }}>
            <strong>Required Fields Status:</strong>
            <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {Object.entries(validation.requiredFields).map(([field, status]) => (
                <div key={field} style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ 
                    color: status ? '#155724' : '#721c24',
                    marginRight: '0.5rem'
                  }}>
                    {status ? '✓' : '✗'}
                  </span>
                  <span style={{ textTransform: 'capitalize' }}>
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results Help */}
      {searched && committees.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 1rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🔍</div>
          <h4 style={{ color: '#495057', marginBottom: '1rem' }}>No committees found</h4>
          <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
            We couldn't find any committees matching "{searchTerm}". Try:
          </p>
          <ul style={{ 
            textAlign: 'left', 
            maxWidth: '400px', 
            margin: '0 auto 2rem auto',
            color: '#6c757d'
          }}>
            <li>Different keywords or abbreviations</li>
            <li>Just the candidate's last name</li>
            <li>The committee's short name</li>
          </ul>
          <p style={{ color: '#6c757d', fontSize: '14px' }}>
            <strong>For testing:</strong> Admin can add test committees via the admin panel
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onPrev}>
          ← Back
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleConfirmCommittee}
          disabled={!selectedCommittee || (validation && !validation.isValid)}
        >
          Next: Connect Bank Account →
        </button>
        
        {/* Skip option when FEC API is unavailable */}
        {searched && committees.length === 0 && (
          <button 
            className="btn btn-secondary"
            onClick={() => {
              updateFormData({
                fecCommitteeId: 'manual-entry',
                committeeName: 'Manual Entry - To Be Updated',
                selectedCommittee: { id: 'manual', name: 'Manual Entry', source: 'manual' }
              });
              onNext();
            }}
            style={{ marginTop: '1rem', background: '#6c757d', color: 'white' }}
          >
            Continue Without Committee (Can Update Later) →
          </button>
        )}
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '6px',
        fontSize: '14px',
        color: '#6c757d'
      }}>
        <strong style={{ color: '#495057' }}>📌 Committee Selection Help:</strong>
        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem' }}>
          <li>Search results include both real FEC committees and test committees</li>
          <li>Test committees are marked with 🧪 and are used for development</li>
          <li>All committee information must be complete for ActBlue compliance</li>
          <li>Contact admin if you can't find your committee</li>
        </ul>
      </div>
    </div>
  );
};

export default CommitteeSearch;