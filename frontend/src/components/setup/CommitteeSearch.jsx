import React, { useState, useEffect } from 'react';
import { fecAPI } from '../../lib/fec-api.js';
import { supabase } from '../../lib/supabase';

const CommitteeSearch = ({ formData, updateFormData, onNext, onPrev, campaignId }) => {
  console.log('📋 CommitteeSearch received campaignId:', campaignId);
  const [searchTerm, setSearchTerm] = useState(formData.committeeNameSearch || '');
  const [committees, setCommittees] = useState([]);
  const [selectedCommittee, setSelectedCommittee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searched, setSearched] = useState(false);
  const [validation, setValidation] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [manualCommittee, setManualCommittee] = useState({
    name: '',
    id: '',
    type: 'N',
    candidateName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  // Auto-search on component mount if we have a search term
  useEffect(() => {
    if (formData.committeeNameSearch && !searched) {
      handleSearch(formData.committeeNameSearch);
    }
  }, []);

  // Auto-search as user types with debounce
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);

    if (searchTerm && searchTerm.length >= 3) {
      const timeout = setTimeout(() => {
        handleSearchRealtime(searchTerm);
      }, 500);
      setSearchTimeout(timeout);
    } else {
      setCommittees([]);
      setShowDropdown(false);
    }

    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.committee-search-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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
        setError(
          `No committees found for "${term}". Try different keywords or contact admin to add a test committee.`
        );
      }
    } catch (err) {
      // FEC API search failed, showing manual entry option
      setError(
        'FEC API search temporarily unavailable. You can enter committee information manually below.'
      );
      setCommittees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchRealtime = async (term) => {
    if (!term.trim() || term.trim().length < 3) {
      setCommittees([]);
      setShowDropdown(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('Searching FEC API for:', term);

      // Call FEC API directly
      const apiKey = 'F7QA9sKDcXZOjuqz2nk7DzZXLenyzf3GEYaZqpFD';
      const url = `https://api.open.fec.gov/v1/committees/?q=${encodeURIComponent(term.trim())}&per_page=10&is_active=true&sort=name&api_key=${apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`FEC API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const formattedCommittees = data.results.map((committee) => ({
          id: committee.committee_id,
          name: committee.name,
          candidateName: committee.candidate_name || null,
          type: committee.committee_type,
          organizationType: committee.organization_type,
          city: committee.city,
          state: committee.state,
          treasurerName: committee.treasurer_name,
          isActive: true,
          source: 'fec',
        }));

        setCommittees(formattedCommittees);
        setShowDropdown(true);
        setError('');
      } else {
        setCommittees([]);
        setShowDropdown(false);
      }
    } catch (err) {
      console.error('FEC API search error:', err);
      setCommittees([]);
      setShowDropdown(false);
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
            zipCode: '12345',
          },
          contacts: {
            treasurerName: 'Test Treasurer',
          },
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
        committeeValidation: validation,
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

  // Development bypass function
  const handleDevBypass = () => {
    const testCommittee = {
      id: 'DEV-BYPASS-' + Date.now(),
      name: 'Development Test Committee',
      source: 'dev-bypass',
      address: '123 Dev Street',
      city: 'Test City',
      state: 'CA',
      zip: '90210',
      type: 'TEST'
    };

    setSelectedCommittee(testCommittee);
    setValidation({ isValid: true, errors: [], warnings: [], requiredFields: {} });
    
    updateFormData({
      selectedCommittee: testCommittee,
      committeeDetails: {
        id: testCommittee.id,
        name: testCommittee.name,
        source: 'dev-bypass',
        address: {
          street1: testCommittee.address,
          city: testCommittee.city,
          state: testCommittee.state,
          zipCode: testCommittee.zip,
        },
        isActive: true,
      },
      committeeName: testCommittee.name,
      fecCommitteeId: testCommittee.id,
      committeeAddress: testCommittee.address,
      committeeCity: testCommittee.city,
      committeeState: testCommittee.state,
      committeeZip: testCommittee.zip,
    });

    setSuccess('Development committee created successfully!');
    
    // Auto-advance after a brief delay
    setTimeout(() => {
      onNext();
    }, 1000);
  };

  const logBypassUsage = async () => {
    try {
      // Try to create the table first if RPC function exists
      try {
        await supabase.rpc('create_error_logs_table_if_not_exists');
      } catch (rpcError) {
        // RPC function not available, table should be created manually
      }

      // Log the bypass event - will fail gracefully if table doesn't exist
      const logData = {
        error_type: 'FEC_API_BYPASS',
        error_message: 'User bypassed FEC API search due to unavailability',
        user_agent: navigator.userAgent,
        url: window.location.href,
        search_term: searchTerm,
        timestamp: new Date().toISOString(),
      };

      const { error: logError } = await supabase.from('error_logs').insert([logData]);

      if (logError) {
        // Table doesn't exist, bypass logging failed
      }
    } catch (err) {
      // Error logging bypass usage
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
      setError(''); // Clear previous errors

      // Create the committee object immediately
      const savedCommittee = {
        id: 'MANUAL-' + Date.now(),
        name: manualCommittee.name.trim(),
        source: 'manual',
        address: manualCommittee.address.trim(),
        city: manualCommittee.city.trim(),
        state: manualCommittee.state.trim(),
        zip: manualCommittee.zip.trim(),
      };

      // Set the selected committee FIRST so the Next button becomes enabled immediately
      setSelectedCommittee(savedCommittee);

      // Update form data immediately
      updateFormData({
        selectedCommittee: savedCommittee,
        committeeDetails: {
          id: savedCommittee.id,
          name: savedCommittee.name,
          source: 'manual',
          address: {
            street1: savedCommittee.address,
            city: savedCommittee.city,
            state: savedCommittee.state,
            zipCode: savedCommittee.zip,
          },
          isActive: true,
        },
        committeeName: savedCommittee.name,
        fecCommitteeId: savedCommittee.id,
        committeeAddress: savedCommittee.address,
        committeeCity: savedCommittee.city,
        committeeState: savedCommittee.state,
        committeeZip: savedCommittee.zip,
      });

      // Show success message immediately
      setSuccess('Committee information saved successfully!');

      // Try to save to database in background (non-blocking)
      try {
        if (campaignId) {
          console.log('Attempting to save committee to database...', campaignId);
          
          const committeeData = {
            committee_name: manualCommittee.name.trim(),
            fec_committee_id: savedCommittee.id,
            committee_address: manualCommittee.address.trim(),
            committee_city: manualCommittee.city.trim(),
            committee_state: manualCommittee.state.trim(),
            committee_zip: manualCommittee.zip.trim(),
          };

          const { data: updatedCampaign, error: updateError } = await supabase
            .from('campaigns')
            .update(committeeData)
            .eq('id', campaignId)
            .select();

          if (updateError) {
            console.warn('Database save failed (continuing anyway):', updateError);
          } else {
            console.log('Committee saved to database:', updatedCampaign);
          }
        }
      } catch (dbError) {
        console.warn('Database save error (form still works):', dbError.message);
      }

      // Clear the manual form after successful save
      setManualCommittee({
        name: '',
        id: '',
        type: 'N',
        candidateName: '',
        address: '',
        city: '',
        state: '',
        zip: '',
      });

    } catch (err) {
      setError('Failed to save committee information: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCommitteeType = (type) => {
    const types = {
      P: 'Presidential',
      H: 'House',
      S: 'Senate',
      N: 'PAC',
      Q: 'Qualified Non-Profit',
      TEST: 'Test Committee',
    };
    return types[type] || type;
  };

  return (
    <div>

      {/* Search Section */}
      <div
        className="crypto-card mb-8 committee-search-container"
        style={{
          background: 'hsl(var(--crypto-navy)) !important',
          border: '1px solid hsl(var(--crypto-white) / 0.2)',
        }}
      >
        <div className="form-group" style={{ marginBottom: '1rem', position: 'relative' }}>
          <label
            style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'hsl(var(--crypto-white))',
              marginBottom: '0.5rem',
              display: 'block',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Search for Committee
          </label>
          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type at least 3 characters to search..."
              style={{ width: '100%', paddingRight: loading ? '100px' : '10px' }}
            />
            {loading && (
              <div
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--crypto-white) / 0.6)',
                  fontSize: '14px',
                }}
              >
                Searching...
              </div>
            )}

            {/* Dropdown for search results */}
            {showDropdown && committees.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  marginTop: '4px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 10,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              >
                {committees.map((committee, index) => (
                  <div
                    key={committee.id}
                    onClick={() => {
                      handleSelectCommittee(committee);
                      setShowDropdown(false);
                      setSearchTerm(committee.name);
                    }}
                    style={{
                      padding: '12px 15px',
                      borderBottom:
                        index < committees.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                      cursor: 'pointer',
                      background:
                        selectedCommittee?.id === committee.id
                          ? 'hsl(var(--crypto-blue) / 0.1)'
                          : 'white',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'hsl(var(--crypto-blue) / 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background =
                        selectedCommittee?.id === committee.id
                          ? 'hsl(var(--crypto-blue) / 0.1)'
                          : 'white';
                    }}
                  >
                    <div
                      style={{
                        fontWeight: '500',
                        color: 'hsl(var(--crypto-navy))',
                        marginBottom: '4px',
                      }}
                    >
                      {committee.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'hsl(var(--crypto-navy) / 0.6)' }}>
                      {committee.id} •{' '}
                      {committee.city && committee.state
                        ? `${committee.city}, ${committee.state}`
                        : 'Location not available'}{' '}
                      • {committee.type}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {searchTerm.length >= 3 && !showDropdown && committees.length === 0 && !loading && (
          <div style={{ fontSize: '14px', color: 'hsl(var(--crypto-white) / 0.7)' }}>
            No committees found for "{searchTerm}"
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            background: 'hsl(var(--destructive) / 0.1)',
            color: 'hsl(var(--destructive))',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: '1px solid hsl(var(--destructive) / 0.2)',
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div
          style={{
            background: 'hsl(120 60% 95%)',
            color: 'hsl(120 60% 25%)',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: '1px solid hsl(120 60% 80%)',
          }}
        >
          ✅ {success}
        </div>
      )}

      {/* Manual Committee Entry */}
      <div
        className="crypto-card mb-8 text-center"
        style={{
          background: 'hsl(var(--crypto-navy)) !important',
          border: '1px solid hsl(var(--crypto-white) / 0.2)',
        }}
      >
        <h4
          className="mb-4"
          style={{ fontSize: 'var(--text-heading-md)', color: 'hsl(var(--crypto-white))' }}
        >
          Can't find your committee? Add it manually
        </h4>
        <p className="mb-4" style={{ fontSize: '14px', color: 'hsl(var(--crypto-white) / 0.8)' }}>
          Enter your committee name or keywords...
        </p>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={manualCommittee.name}
            onChange={(e) => setManualCommittee({ ...manualCommittee, name: e.target.value })}
            placeholder="Enter your committee name"
            style={{
              width: '100%',
              maxWidth: '400px',
              margin: '0 auto 1rem auto',
              display: 'block',
              padding: '0.75rem',
              border: '1px solid hsl(var(--crypto-blue) / 0.4)',
              borderRadius: 'var(--radius)',
              background: 'hsl(223 57% 25% / 0.5)',
              color: 'hsl(var(--crypto-white))',
              fontSize: '1rem',
              fontFamily: 'Inter, sans-serif',
              transition: 'var(--transition-smooth)',
            }}
          />

          <input
            type="text"
            value={manualCommittee.address}
            onChange={(e) => setManualCommittee({ ...manualCommittee, address: e.target.value })}
            placeholder="Committee address"
            style={{
              width: '100%',
              maxWidth: '400px',
              margin: '0 auto 1rem auto',
              display: 'block',
              padding: '0.75rem',
              border: '1px solid hsl(var(--crypto-blue) / 0.4)',
              borderRadius: 'var(--radius)',
              background: 'hsl(223 57% 25% / 0.5)',
              color: 'hsl(var(--crypto-white))',
              fontSize: '1rem',
              fontFamily: 'Inter, sans-serif',
              transition: 'var(--transition-smooth)',
            }}
          />

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <input
              type="text"
              value={manualCommittee.city}
              onChange={(e) => setManualCommittee({ ...manualCommittee, city: e.target.value })}
              placeholder="City"
              style={{
                width: '120px',
                padding: '0.75rem',
                border: '1px solid hsl(var(--crypto-blue) / 0.4)',
                borderRadius: 'var(--radius)',
                background: 'hsl(223 57% 25% / 0.5)',
                color: 'hsl(var(--crypto-white))',
                fontSize: '1rem',
                fontFamily: 'Inter, sans-serif',
                transition: 'var(--transition-smooth)',
              }}
            />
            <input
              type="text"
              value={manualCommittee.state}
              onChange={(e) => setManualCommittee({ ...manualCommittee, state: e.target.value })}
              placeholder="State"
              maxLength="2"
              style={{
                width: '80px',
                padding: '0.75rem',
                border: '1px solid hsl(var(--crypto-blue) / 0.4)',
                borderRadius: 'var(--radius)',
                background: 'hsl(223 57% 25% / 0.5)',
                color: 'hsl(var(--crypto-white))',
                fontSize: '1rem',
                fontFamily: 'Inter, sans-serif',
                transition: 'var(--transition-smooth)',
              }}
            />
            <input
              type="text"
              value={manualCommittee.zip}
              onChange={(e) => setManualCommittee({ ...manualCommittee, zip: e.target.value })}
              placeholder="ZIP"
              maxLength="10"
              style={{
                width: '100px',
                padding: '0.75rem',
                border: '1px solid hsl(var(--crypto-blue) / 0.4)',
                borderRadius: 'var(--radius)',
                background: 'hsl(223 57% 25% / 0.5)',
                color: 'hsl(var(--crypto-white))',
                fontSize: '1rem',
                fontFamily: 'Inter, sans-serif',
                transition: 'var(--transition-smooth)',
              }}
            />
          </div>
        </div>

        <button
          onClick={handleManualCommitteeSubmit}
          disabled={
            loading ||
            !manualCommittee.name.trim() ||
            !manualCommittee.address.trim() ||
            !manualCommittee.city.trim() ||
            !manualCommittee.state.trim() ||
            !manualCommittee.zip.trim()
          }
          style={{
            background:
              loading ||
              !manualCommittee.name.trim() ||
              !manualCommittee.address.trim() ||
              !manualCommittee.city.trim() ||
              !manualCommittee.state.trim() ||
              !manualCommittee.zip.trim()
                ? 'hsl(var(--crypto-medium-gray))'
                : 'hsl(var(--crypto-navy))',
            color: 'hsl(var(--crypto-white))',
            border: 'none',
            padding: 'var(--space-sm) var(--space-lg)',
            borderRadius: 'var(--radius)',
            cursor:
              loading ||
              !manualCommittee.name.trim() ||
              !manualCommittee.address.trim() ||
              !manualCommittee.city.trim() ||
              !manualCommittee.state.trim() ||
              !manualCommittee.zip.trim()
                ? 'not-allowed'
                : 'pointer',
            fontSize: 'var(--text-body)',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            opacity:
              loading ||
              !manualCommittee.name.trim() ||
              !manualCommittee.address.trim() ||
              !manualCommittee.city.trim() ||
              !manualCommittee.state.trim() ||
              !manualCommittee.zip.trim()
                ? 0.6
                : 1,
            transition: 'var(--transition-smooth)',
          }}
        >
          {loading ? 'Saving...' : 'Save Committee Info & Continue'}
        </button>
      </div>

      {/* Selected Committee Display */}
      {selectedCommittee && !showDropdown && (
        <div style={{ marginBottom: '2rem' }}>
          <h4
            className="text-foreground"
            style={{ marginBottom: '1rem', fontSize: 'var(--text-heading-sm)' }}
          >
            Selected Committee
          </h4>

          <div
            style={{
              border: '1px solid hsl(var(--crypto-gold))',
              borderRadius: '6px',
              padding: '1rem',
              background: 'hsl(var(--crypto-gold) / 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <h5
                  style={{
                    margin: '0 0 0.5rem 0',
                    color: 'hsl(var(--crypto-navy))',
                    fontSize: 'var(--text-body)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {selectedCommittee.name}
                </h5>

                <div style={{ marginBottom: '0.5rem' }}>
                  <span
                    style={{
                      background: 'hsl(var(--crypto-white))',
                      color: 'hsl(var(--crypto-navy))',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      marginRight: '0.5rem',
                    }}
                  >
                    {formatCommitteeType(selectedCommittee.type)}
                  </span>

                  {selectedCommittee.source === 'fec' && (
                    <span
                      style={{
                        background: 'hsl(var(--crypto-gold) / 0.2)',
                        color: 'hsl(var(--crypto-navy))',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      FEC VERIFIED
                    </span>
                  )}
                </div>

                <div className="text-base text-muted-foreground">
                  <div>
                    <strong>ID:</strong> {selectedCommittee.id}
                  </div>
                  {selectedCommittee.candidateName && (
                    <div>
                      <strong>Candidate:</strong> {selectedCommittee.candidateName}
                    </div>
                  )}
                  {selectedCommittee.city && selectedCommittee.state && (
                    <div>
                      <strong>Location:</strong> {selectedCommittee.city}, {selectedCommittee.state}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginLeft: '1rem' }}>
                <span
                  style={{
                    color: 'hsl(var(--crypto-navy))',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}
                >
                  ✓ SELECTED
                </span>
                <button
                  onClick={() => {
                    setSelectedCommittee(null);
                    setSearchTerm('');
                    setValidation(null);
                    setCommittees([]);
                  }}
                  style={{
                    display: 'block',
                    marginTop: '10px',
                    background: 'transparent',
                    color: 'hsl(var(--crypto-navy))',
                    border: '1px solid hsl(var(--crypto-navy))',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Change Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Committee Validation */}
      {selectedCommittee && validation && (
        <div
          style={{
            background: validation.isValid
              ? 'hsl(var(--crypto-gold) / 0.1)'
              : 'hsl(var(--destructive) / 0.1)',
            border: `1px solid ${validation.isValid ? 'hsl(var(--crypto-gold) / 0.3)' : 'hsl(var(--destructive) / 0.3)'}`,
            borderRadius: '6px',
            padding: '1rem',
            marginBottom: '2rem',
          }}
        >
          <h5
            style={{
              color: validation.isValid ? 'hsl(var(--crypto-navy))' : 'hsl(var(--destructive))',
              margin: '0 0 1rem 0',
            }}
          >
            {validation.isValid ? 'Committee Validation Passed' : 'Committee Validation Issues'}
          </h5>

          {validation.errors.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'hsl(var(--destructive))' }}>Errors:</strong>
              <ul
                style={{
                  margin: '0.5rem 0 0 0',
                  paddingLeft: '1.2rem',
                  color: 'hsl(var(--destructive))',
                }}
              >
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'hsl(var(--crypto-navy))' }}>Warnings:</strong>
              <ul
                style={{
                  margin: '0.5rem 0 0 0',
                  paddingLeft: '1.2rem',
                  color: 'hsl(var(--crypto-navy))',
                }}
              >
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ fontSize: '14px' }}>
            <strong>Required Fields Status:</strong>
            <div
              style={{
                marginTop: '0.5rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
              }}
            >
              {Object.entries(validation.requiredFields).map(([field, status]) => (
                <div key={field} style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      color: status ? 'hsl(var(--crypto-navy))' : 'hsl(var(--destructive))',
                      marginRight: '0.5rem',
                    }}
                  >
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
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            background: 'hsl(var(--muted))',
            borderRadius: '8px',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>Search</div>
          <h4
            className="text-foreground"
            style={{ marginBottom: '1rem', fontSize: 'var(--text-heading-sm)' }}
          >
            No committees found
          </h4>
          <p className="text-muted-foreground" style={{ marginBottom: '2rem' }}>
            We couldn't find any committees matching "{searchTerm}". Try:
          </p>
          <ul
            style={{
              textAlign: 'left',
              maxWidth: '400px',
              margin: '0 auto 2rem auto',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            <li>Different keywords or abbreviations</li>
            <li>Just the candidate's last name</li>
            <li>The committee's short name</li>
          </ul>
        </div>
      )}


      {/* Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '2rem',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={onPrev}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: 'hsl(var(--crypto-gold))',
              color: 'hsl(var(--crypto-navy))',
              fontSize: '1rem',
              fontWeight: '700',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)',
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
            }}
          >
            BACK
          </button>
          <div style={{
            color: 'hsl(var(--crypto-gold))',
            fontSize: '1.5rem',
            marginTop: '0.5rem',
          }}>
            ←
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={handleConfirmCommittee}
            disabled={!selectedCommittee || (validation && !validation.isValid)}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: 'var(--radius)',
              border: '2px solid hsl(var(--crypto-gold))',
              background: (!selectedCommittee || (validation && !validation.isValid))
                ? 'hsl(var(--crypto-white) / 0.1)'
                : 'hsl(var(--crypto-gold))',
              color: (!selectedCommittee || (validation && !validation.isValid))
                ? 'hsl(var(--crypto-white) / 0.5)'
                : 'hsl(var(--crypto-navy))',
              fontSize: '1rem',
              fontWeight: '700',
              fontFamily: 'Inter, sans-serif',
              cursor: (!selectedCommittee || (validation && !validation.isValid)) ? 'not-allowed' : 'pointer',
              transition: 'var(--transition-smooth)',
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
              opacity: (!selectedCommittee || (validation && !validation.isValid)) ? 0.6 : 1,
            }}
          >
            NEXT
          </button>
          <div style={{
            color: 'hsl(var(--crypto-gold))',
            fontSize: '1.5rem',
            marginTop: '0.5rem',
          }}>
            →
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitteeSearch;
