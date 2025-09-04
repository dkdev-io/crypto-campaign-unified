import React, { useState, useEffect } from 'react';
import { fecAPI } from '../../lib/fec-api.js';
import { supabase } from '../../lib/supabase';

const CommitteeSearch = ({ formData, updateFormData, onNext, onPrev, campaignId }) => {
  const [searchTerm, setSearchTerm] = useState(formData.committeeNameSearch || '');
  const [committees, setCommittees] = useState([]);
  const [selectedCommittee, setSelectedCommittee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searched, setSearched] = useState(false);
  const [validation, setValidation] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCommittee, setManualCommittee] = useState({
    name: '',
    id: '',
    type: 'N',
    candidateName: '',
    address: '',
    city: '',
    state: '',
    zip: ''
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
      setSuccess('');
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

  const handleManualCommitteeSubmit = async () => {
    if (!manualCommittee.name.trim()) {
      setError('Committee name is required');
      return;
    }
    if (!manualCommittee.address.trim()) {
      setError('Committee address is required');
      return;
    }
    if (!manualCommittee.city.trim()) {
      setError('Committee city is required');
      return;
    }
    if (!manualCommittee.state.trim()) {
      setError('Committee state is required');
      return;
    }
    if (!manualCommittee.zip.trim()) {
      setError('Committee ZIP code is required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Save complete committee information to the current campaign in Supabase
      if (!campaignId) {
        throw new Error('Campaign ID not found. Please refresh and try again.');
      }
      
      const committeeData = {
        committee_name: manualCommittee.name.trim(),
        fec_committee_id: 'MANUAL-' + Date.now(),
        committee_address: manualCommittee.address.trim(),
        committee_city: manualCommittee.city.trim(),
        committee_state: manualCommittee.state.trim(),
        committee_zip: manualCommittee.zip.trim(),
        committee_contact_info: {
          name: manualCommittee.name.trim(),
          address: manualCommittee.address.trim(),
          city: manualCommittee.city.trim(),
          state: manualCommittee.state.trim(),
          zip: manualCommittee.zip.trim(),
          entryMethod: 'manual',
          savedAt: new Date().toISOString()
        }
      };
      
      console.log('Saving committee data to Supabase:', committeeData);
      
      // Try to save to database first
      let savedToDatabase = false;
      try {
        const { data: updatedCampaign, error: updateError } = await supabase
          .from('campaigns')
          .update(committeeData)
          .eq('id', campaignId)
          .select();
          
        if (updateError) {
          console.warn('Database save failed (columns may not exist yet):', updateError.message);
          // Don't throw here, continue with localStorage
        } else {
          console.log('✅ Committee information saved to Supabase:', updatedCampaign);
          savedToDatabase = true;
        }
      } catch (dbError) {
        console.warn('Database save error, using localStorage fallback:', dbError.message);
      }
      
      // Update form data and proceed
      updateFormData({
        selectedCommittee: {
          id: 'MANUAL-' + Date.now(),
          name: manualCommittee.name.trim(),
          source: 'manual',
          address: manualCommittee.address.trim(),
          city: manualCommittee.city.trim(),
          state: manualCommittee.state.trim(),
          zip: manualCommittee.zip.trim()
        },
        committeeDetails: {
          id: 'MANUAL-' + Date.now(),
          name: manualCommittee.name.trim(),
          source: 'manual',
          address: {
            street1: manualCommittee.address.trim(),
            city: manualCommittee.city.trim(),
            state: manualCommittee.state.trim(),
            zipCode: manualCommittee.zip.trim()
          },
          isActive: true
        },
        committeeName: manualCommittee.name.trim(),
        fecCommitteeId: 'MANUAL-' + Date.now(),
        committeeAddress: manualCommittee.address.trim(),
        committeeCity: manualCommittee.city.trim(),
        committeeState: manualCommittee.state.trim(),
        committeeZip: manualCommittee.zip.trim()
      });
      
      setSuccess(savedToDatabase ? 
        'Committee information saved to database successfully!' : 
        'Committee information saved locally (database columns pending)!');
      
      // Clear the manual form after successful save
      setManualCommittee({
        name: '',
        id: '',
        type: 'N',
        candidateName: '',
        address: '',
        city: '',
        state: '',
        zip: ''
      });
      
    } catch (err) {
      console.error('Failed to save committee information:', err);
      setError('Failed to save committee information: ' + err.message);
    } finally {
      setLoading(false);
    }
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
      <h2 className="text-center mb-4 font-bold text-foreground" style={{fontSize: 'var(--text-heading-xl)', color: 'hsl(var(--crypto-navy))'}}>
        Find Your Committee - Step 2
      </h2>
      <p className="text-center mb-8 text-muted-foreground">
        Search for your FEC committee to complete registration
      </p>

      {/* Search Section */}
      <div className="crypto-card mb-8">
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
                background: 'hsl(var(--crypto-navy))',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                minWidth: '100px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {searched && (
          <div className="text-sm text-muted-foreground">
            Searching: "{searchTerm}" • Found {committees.length} result{committees.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          background: 'hsl(var(--destructive) / 0.1)', 
          color: 'hsl(var(--destructive))', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: '1px solid hsl(var(--destructive) / 0.2)'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div style={{ 
          background: 'hsl(120 60% 95%)', 
          color: 'hsl(120 60% 25%)', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: '1px solid hsl(120 60% 80%)'
        }}>
          ✅ {success}
        </div>
      )}

      {/* Simple Committee Entry */}
      <div className="crypto-card mb-8 text-center">
        <h4 className="text-foreground mb-4" style={{fontSize: 'var(--text-heading-md)'}}>
          Add Committee Name
        </h4>
        <p className="text-muted-foreground mb-4 text-sm">
          Can't find your committee? Add it manually
        </p>
        
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <input
            className="form-input"
            type="text"
            value={manualCommittee.name}
            onChange={(e) => setManualCommittee({...manualCommittee, name: e.target.value})}
            placeholder="Enter your committee name"
            style={{ 
              width: '100%',
              maxWidth: '400px',
              margin: '0 auto 1rem auto',
              display: 'block'
            }}
          />
          
          <input
            className="form-input"
            type="text"
            value={manualCommittee.address}
            onChange={(e) => setManualCommittee({...manualCommittee, address: e.target.value})}
            placeholder="Committee address"
            style={{ 
              width: '100%',
              maxWidth: '400px',
              margin: '0 auto 1rem auto',
              display: 'block'
            }}
          />
          
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <input
              className="form-input"
              type="text"
              value={manualCommittee.city}
              onChange={(e) => setManualCommittee({...manualCommittee, city: e.target.value})}
              placeholder="City"
              style={{ 
                width: '120px'
              }}
            />
            <input
              className="form-input"
              type="text"
              value={manualCommittee.state}
              onChange={(e) => setManualCommittee({...manualCommittee, state: e.target.value})}
              placeholder="State"
              style={{ 
                width: '80px'
              }}
              maxLength="2"
            />
            <input
              className="form-input"
              type="text"
              value={manualCommittee.zip}
              onChange={(e) => setManualCommittee({...manualCommittee, zip: e.target.value})}
              placeholder="ZIP"
              style={{ 
                width: '100px'
              }}
              maxLength="10"
            />
          </div>
        </div>
        
        <button
          onClick={handleManualCommitteeSubmit}
          disabled={loading || !manualCommittee.name.trim() || !manualCommittee.address.trim() || !manualCommittee.city.trim() || !manualCommittee.state.trim() || !manualCommittee.zip.trim()}
          style={{
            background: '#2a2a72',
            color: 'white',
            border: 'none',
            padding: '0.75rem 2rem',
            borderRadius: '4px',
            cursor: loading || !manualCommittee.name.trim() || !manualCommittee.address.trim() || !manualCommittee.city.trim() || !manualCommittee.state.trim() || !manualCommittee.zip.trim() ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            opacity: loading || !manualCommittee.name.trim() || !manualCommittee.address.trim() || !manualCommittee.city.trim() || !manualCommittee.state.trim() || !manualCommittee.zip.trim() ? 0.7 : 1
          }}
        >
          {loading ? 'Saving...' : 'Save Committee Info & Continue'}
        </button>
      </div>

      {/* Committee Results */}
      {committees.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 className="text-foreground" style={{marginBottom: '1rem', fontSize: 'var(--text-heading-sm)'}}>
            Select Your Committee ({committees.length} found)
          </h4>
          
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }}>
            {committees.map((committee, index) => (
              <div
                key={committee.id}
                onClick={() => handleSelectCommittee(committee)}
                style={{
                  padding: '1rem',
                  borderBottom: index < committees.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                  cursor: 'pointer',
                  background: selectedCommittee?.id === committee.id ? '#e3f2fd' : 'white',
                  borderLeft: selectedCommittee?.id === committee.id ? '4px solid #2a2a72' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (selectedCommittee?.id !== committee.id) {
                    e.target.style.background = 'hsl(var(--muted))';
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
                      color: 'hsl(var(--crypto-navy))',
                      fontSize: '16px'
                    }}>
                      {committee.name}
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
                          color: 'hsl(var(--crypto-navy))', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          TEST COMMITTEE
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground">
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
                        color: 'hsl(var(--crypto-navy))', 
                        fontSize: '20px',
                        fontWeight: 'bold'
                      }}>
                        SELECTED
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
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
            {validation.isValid ? 'Committee Validation Passed' : 'Committee Validation Issues'}
          </h5>

          {validation.errors.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'hsl(var(--destructive))' }}>Errors:</strong>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', color: 'hsl(var(--destructive))' }}>
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'hsl(var(--crypto-navy))' }}>Warnings:</strong>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', color: 'hsl(var(--crypto-navy))' }}>
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
                    {status ? 'YES' : 'NO'}
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
          background: 'hsl(var(--muted))',
          borderRadius: '8px',
          border: '1px solid hsl(var(--border))'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>Search</div>
          <h4 className="text-foreground" style={{marginBottom: '1rem', fontSize: 'var(--text-heading-sm)'}}>No committees found</h4>
          <p className="text-muted-foreground" style={{marginBottom: '2rem'}}>
            We couldn't find any committees matching "{searchTerm}". Try:
          </p>
          <ul style={{ 
            textAlign: 'left', 
            maxWidth: '400px', 
            margin: '0 auto 2rem auto',
            color: 'hsl(var(--muted-foreground))'
          }}>
            <li>Different keywords or abbreviations</li>
            <li>Just the candidate's last name</li>
            <li>The committee's short name</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            <strong>For testing:</strong> Admin can add test committees via the admin panel
          </p>
        </div>
      )}

      {/* Success Message with Continue Button */}
      {success && (
        <div style={{ 
          background: '#d4edda', 
          border: '1px solid #c3e6cb',
          borderRadius: '6px',
          padding: '2rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h4 style={{ color: 'hsl(var(--crypto-navy))', margin: '0 0 1rem 0' }}>
            Committee Information Saved!
          </h4>
          <p style={{ color: 'hsl(var(--crypto-navy))', margin: '0 0 2rem 0' }}>
            {success}
          </p>
          <button 
            className="btn btn-primary"
            onClick={onNext}
            style={{
              background: 'hsl(var(--crypto-gold))',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Continue to Next Step
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onPrev}>
          Back
        </button>
        
        {/* Only show standard next button if no committee saved yet */}
        {!success && (
          <>
            <button 
              className="btn btn-primary"
              onClick={handleConfirmCommittee}
              disabled={!selectedCommittee || (validation && !validation.isValid)}
            >
              Next
            </button>
            
            {/* Always show skip button for testing */}
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
              style={{ 
                marginTop: '1rem', 
                background: 'hsl(var(--muted))', 
                color: 'white',
                display: 'block',
                width: '100%'
              }}
            >
              Continue Without Committee (Can Update Later)
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default CommitteeSearch;