import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Shield, Lock, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import CampaignAuthNav from '../campaigns/CampaignAuthNav';

const BankConnectionForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});

  // Load existing form data from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('campaignSetupData');
      if (saved) {
        const savedData = JSON.parse(saved);
        setFormData(savedData);
      }
    } catch (e) {
      console.warn('Could not load saved data:', e);
    }
  }, []);

  const updateFormData = (newData) => {
    const updatedData = { ...formData, ...newData };
    setFormData(updatedData);
    
    // Save to localStorage
    try {
      localStorage.setItem('campaignSetupData', JSON.stringify(updatedData));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  };

  const handleSkipForDev = () => {
    setLoading(true);
    
    updateFormData({ 
      skipBankConnection: true,
      bankAccountVerified: false,
      bankConnectionStatus: 'skipped'
    });
    
    setTimeout(() => {
      setLoading(false);
      navigate('/WebsiteStyle');
    }, 1000);
  };

  const handleBack = () => {
    navigate('/CommitteeSearch');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <CampaignAuthNav />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          <div className="bg-card rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4"></div>
              <h2 className="font-bold text-foreground mb-2" style={{fontSize: 'var(--text-heading-xl)'}}>
                Connect Bank Account
              </h2>
              <p className="text-muted-foreground">
                Step 3: Securely connect your campaign's bank account
              </p>
            </div>

            {/* Coming Soon Banner */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="text-center">
                <div className="mb-3"></div>
                <h3 className="font-semibold mb-2" style={{fontSize: 'var(--text-heading-md)', color: 'hsl(var(--crypto-navy))'}}>
                  Plaid Integration Coming Soon
                </h3>
                <p className="text-blue-700 text-sm mb-4">
                  We're currently implementing secure bank account integration with Plaid. 
                  This will allow you to safely connect your campaign's bank account for contribution processing.
                </p>
                <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                  Expected: Next Update
                </div>
              </div>
            </div>

            {/* Security Information */}
            <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-green-900 mb-4">
                <Shield className="w-5 h-5" />
                Your Security is Our Priority
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 mt-0.5 text-green-600" />
                  <div>
                    <div className="font-medium">Bank-Level Security</div>
                    <div className="text-green-700">256-bit SSL encryption</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 text-green-600" />
                  <div>
                    <div className="font-medium">Never Store Credentials</div>
                    <div className="text-green-700">Login details never saved</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CreditCard className="w-4 h-4 mt-0.5 text-green-600" />
                  <div>
                    <div className="font-medium">Plaid Integration</div>
                    <div className="text-green-700">Used by thousands of apps</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 mt-0.5 text-green-600" />
                  <div>
                    <div className="font-medium">Disconnect Anytime</div>
                    <div className="text-green-700">Full control over access</div>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                💡 How Bank Connection Will Work
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="font-bold" style={{fontSize: 'var(--text-heading-sm)', color: 'hsl(var(--crypto-blue))'}}>1</span>
                  </div>
                  <div className="font-medium text-gray-900 mb-1">Connect Securely</div>
                  <div className="text-sm text-gray-600">
                    Login through Plaid's secure interface
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="font-bold" style={{fontSize: 'var(--text-heading-sm)', color: 'hsl(var(--crypto-blue))'}}>2</span>
                  </div>
                  <div className="font-medium text-gray-900 mb-1">Select Account</div>
                  <div className="text-sm text-gray-600">
                    Choose your campaign's checking account
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="font-bold" style={{fontSize: 'var(--text-heading-sm)', color: 'hsl(var(--crypto-blue))'}}>3</span>
                  </div>
                  <div className="font-medium text-gray-900 mb-1">Start Processing</div>
                  <div className="text-sm text-gray-600">
                    Begin accepting contributions immediately
                  </div>
                </div>
              </div>
            </div>

            {/* Development Skip Section */}
            <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-900 mb-2">
                    Development Mode
                  </h4>
                  <p className="text-yellow-800 text-sm mb-4">
                    For development and testing purposes, you can skip bank connection 
                    and continue with the campaign setup process. This will be required 
                    for production campaigns.
                  </p>
                  <Button
                    onClick={handleSkipForDev}
                    disabled={loading}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Skipping...
                      </>
                    ) : (
                      <>
                        ⚠️ Skip Bank Connection (Dev Only)
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                onClick={handleBack}
                variant="outline"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Committee
              </Button>
              
              <div className="text-center flex-1 mx-4">
                <div className="text-sm text-muted-foreground">
                  Step 3 of 7 • Bank Connection
                </div>
              </div>
              
              <div className="w-32"> {/* Spacer for alignment */}
              </div>
            </div>

            {/* Technical Note */}
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground">
                <strong>Technical Note:</strong> Plaid integration requires backend 
                API endpoints for creating link tokens and exchanging public tokens. 
                Implementation is in progress.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankConnectionForm;