import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fecAPI } from '../../lib/fec-api.js';
import { Search, Building2, Users, MapPin, AlertCircle, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import CampaignAuthNav from '../campaigns/CampaignAuthNav';

const CommitteeSearchForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [committees, setCommittees] = useState([]);
  const [selectedCommittee, setSelectedCommittee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
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

  // Load saved data from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('campaignSetupData');
      if (saved) {
        const savedData = JSON.parse(saved);
        if (savedData.selectedCommittee) {
          setSelectedCommittee(savedData.selectedCommittee);
          setValidation(savedData.committeeValidation);
        }
      }
    } catch (e) {
      console.warn('Could not load saved committee data:', e);
    }
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a committee name or search term');
      return;
    }

    try {
      setSearching(true);
      setError('');
      setSearched(true);
      setCommittees([]);
      
      console.log('Searching committees for:', searchTerm);
      const result = await fecAPI.searchCommittees(searchTerm.trim(), 20);
      
      console.log('Search result:', result);
      setCommittees(result.committees);
      
      if (result.committees.length === 0) {
        setError(`No committees found for "${searchTerm}". Try different keywords or add manually below.`);
      }

    } catch (err) {
      console.error('Committee search failed:', err);
      setError('FEC API search failed. You can enter committee information manually below.');
      setCommittees([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCommittee = async (committee) => {
    try {
      setLoading(true);
      setSelectedCommittee(committee);
      
      // Get detailed committee information and validate
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
      
      // Save to localStorage
      const savedData = JSON.parse(localStorage.getItem('campaignSetupData') || '{}');
      const updatedData = {
        ...savedData,
        selectedCommittee: committee,
        committeeDetails: details,
        fecCommitteeId: details.id,
        committeeName: details.name,
        committeeValidation: validation
      };
      
      localStorage.setItem('campaignSetupData', JSON.stringify(updatedData));
      console.log('Committee selected and saved:', updatedData);

    } catch (err) {
      console.error('Failed to get committee details:', err);
      setError('Failed to get committee details: ' + err.message);
    } finally {
      setLoading(false);
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
    setShowManualEntry(false);
  };

  const handleContinue = () => {
    if (!selectedCommittee) {
      setError('Please select a committee first');
      return;
    }

    if (validation && !validation.isValid) {
      setError('Selected committee has validation errors that must be resolved');
      return;
    }

    // Navigate to Step 3 (Bank Connection)
    navigate('/BankConnection');
  };

  const handleSkip = () => {
    const savedData = JSON.parse(localStorage.getItem('campaignSetupData') || '{}');
    const updatedData = {
      ...savedData,
      fecCommitteeId: 'manual-entry',
      committeeName: 'Manual Entry - To Be Updated',
      selectedCommittee: { id: 'manual', name: 'Manual Entry', source: 'manual' }
    };
    localStorage.setItem('campaignSetupData', JSON.stringify(updatedData));
    
    navigate('/BankConnection');
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
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <CampaignAuthNav />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          <div className="bg-card rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Find Your Committee
              </h2>
              <p className="text-muted-foreground">
                Step 2: Search for your FEC committee to complete registration
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
                {error.includes('manually') && (
                  <Button
                    onClick={() => {
                      setShowManualEntry(true);
                      setError('');
                    }}
                    size="sm"
                    className="ml-auto bg-green-600 hover:bg-green-700"
                  >
                    Enter Manually
                  </Button>
                )}
              </div>
            )}

            {/* Search Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Search for Committee
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter committee name or keywords..."
                    className="pl-10"
                    onKeyPress={(e) => e.key === 'Enter' && !searching && handleSearch()}
                    disabled={searching}
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  disabled={searching || !searchTerm.trim()}
                  className="min-w-[100px]"
                >
                  {searching ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {committees.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-foreground mb-4">
                  Select Your Committee ({committees.length} found)
                </h4>
                
                <div className="max-h-96 overflow-y-auto border border-border rounded-lg">
                  {committees.map((committee, index) => (
                    <div
                      key={committee.id}
                      onClick={() => handleSelectCommittee(committee)}
                      className={`p-4 cursor-pointer transition-colors border-b border-border last:border-b-0 hover:bg-muted/50 ${
                        selectedCommittee?.id === committee.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <h5 className="font-semibold text-foreground">
                              {committee.name}
                            </h5>
                            {committee.source === 'test' && (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                TEST
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">ID:</span>
                              <span className="font-mono">{committee.id}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Type:</span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {formatCommitteeType(committee.type)}
                              </span>
                            </div>
                            
                            {committee.candidateName && (
                              <div className="flex items-center gap-2">
                                <Users className="w-3 h-3" />
                                <span>Candidate: {committee.candidateName}</span>
                              </div>
                            )}
                            
                            {committee.city && committee.state && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3" />
                                <span>Location: {committee.city}, {committee.state}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-4">
                          {selectedCommittee?.id === committee.id ? (
                            <div className="flex items-center gap-1 text-green-600 font-medium">
                              <Check className="w-4 h-4" />
                              Selected
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
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

            {/* Manual Entry Form */}
            {showManualEntry && (
              <div className="mb-6 p-6 bg-muted/30 border border-border rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-foreground">
                    Manual Committee Entry
                  </h4>
                  <Button
                    onClick={() => setShowManualEntry(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Committee Name *
                    </label>
                    <Input
                      value={manualCommittee.name}
                      onChange={(e) => setManualCommittee({...manualCommittee, name: e.target.value})}
                      placeholder="Enter committee name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Committee ID
                    </label>
                    <Input
                      value={manualCommittee.id}
                      onChange={(e) => setManualCommittee({...manualCommittee, id: e.target.value})}
                      placeholder="FEC ID (optional)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Committee Type
                    </label>
                    <select
                      value={manualCommittee.type}
                      onChange={(e) => setManualCommittee({...manualCommittee, type: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="N">PAC</option>
                      <option value="P">Presidential</option>
                      <option value="H">House</option>
                      <option value="S">Senate</option>
                      <option value="Q">Qualified Non-Profit</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Candidate Name
                    </label>
                    <Input
                      value={manualCommittee.candidateName}
                      onChange={(e) => setManualCommittee({...manualCommittee, candidateName: e.target.value})}
                      placeholder="Candidate name (if applicable)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      City
                    </label>
                    <Input
                      value={manualCommittee.city}
                      onChange={(e) => setManualCommittee({...manualCommittee, city: e.target.value})}
                      placeholder="City"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      State
                    </label>
                    <Input
                      value={manualCommittee.state}
                      onChange={(e) => setManualCommittee({...manualCommittee, state: e.target.value})}
                      placeholder="State"
                      maxLength="2"
                    />
                  </div>
                </div>
                
                <Button
                  onClick={handleManualCommitteeSubmit}
                  className="w-full"
                >
                  Use This Committee
                </Button>
              </div>
            )}

            {/* Committee Validation Results */}
            {selectedCommittee && validation && (
              <div className={`mb-6 p-4 rounded-lg border ${
                validation.isValid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h5 className={`font-semibold mb-2 ${
                  validation.isValid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {validation.isValid ? '✅ Committee Validation Passed' : '⚠️ Committee Validation Issues'}
                </h5>

                {validation.errors.length > 0 && (
                  <div className="mb-3">
                    <strong className="text-red-700">Errors:</strong>
                    <ul className="list-disc list-inside text-red-600 text-sm mt-1">
                      {validation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validation.warnings.length > 0 && (
                  <div className="mb-3">
                    <strong className="text-yellow-700">Warnings:</strong>
                    <ul className="list-disc list-inside text-yellow-600 text-sm mt-1">
                      {validation.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-sm">
                  <strong>Required Fields Status:</strong>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Object.entries(validation.requiredFields).map(([field, status]) => (
                      <div key={field} className="flex items-center gap-2">
                        <span className={status ? 'text-green-600' : 'text-red-600'}>
                          {status ? '✓' : '✗'}
                        </span>
                        <span className="capitalize text-xs">
                          {field.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* No Results Message */}
            {searched && committees.length === 0 && !searching && !error && (
              <div className="text-center py-8 mb-6">
                <div className="text-6xl mb-4">🔍</div>
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  No committees found
                </h4>
                <p className="text-muted-foreground mb-4">
                  We couldn't find any committees matching "{searchTerm}"
                </p>
                <Button
                  onClick={() => setShowManualEntry(true)}
                  variant="outline"
                >
                  Enter Committee Manually
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {selectedCommittee ? (
                <Button 
                  onClick={handleContinue}
                  disabled={validation && !validation.isValid}
                  className="w-full"
                >
                  Continue to Bank Connection →
                </Button>
              ) : !showManualEntry && (
                <Button
                  onClick={() => setShowManualEntry(true)}
                  variant="outline"
                  className="w-full"
                >
                  Can't find your committee? Enter manually
                </Button>
              )}
              
              <Button
                onClick={handleSkip}
                variant="outline" 
                className="w-full"
              >
                Continue Without Committee (Update Later)
              </Button>
              
              <Button
                onClick={() => navigate('/YourInfo')}
                variant="ghost"
                className="w-full"
              >
                ← Back to Campaign Info
              </Button>
            </div>

            {/* Help Section */}
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">
                📌 Committee Selection Help
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Search results include both real FEC committees and test committees</li>
                <li>• Test committees are marked with 🧪 and are used for development</li>
                <li>• All committee information must be complete for compliance</li>
                <li>• Contact admin if you can't find your committee</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitteeSearchForm;