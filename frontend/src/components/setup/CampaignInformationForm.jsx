import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Building2, Globe, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import CampaignAuthNav from '../campaigns/CampaignAuthNav';

const CampaignInformationForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    campaignName: '',
    website: '',
    description: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.campaignName.trim()) {
      errors.campaignName = 'Campaign name is required';
    }

    if (!formData.website.trim()) {
      errors.website = 'Website URL is required';
    } else {
      // Basic URL validation
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(formData.website.trim())) {
        errors.website = 'Please enter a valid website URL';
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!user) {
      setValidationErrors({ submit: 'You must be logged in to create a campaign' });
      return;
    }

    try {
      setLoading(true);
      setValidationErrors({});

      // Create campaign in Supabase campaigns table
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert([
          {
            title: formData.campaignName,
            description: formData.description,
            email: user.email,
            user_id: user.id,
            status: 'setup',
            // Add website info to description for now since no website column exists
            goal_amount: 0,
            current_amount: 0
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Store form data in localStorage for next steps
      localStorage.setItem('campaignSetupData', JSON.stringify({
        campaignId: campaign.id,
        campaignName: formData.campaignName,
        website: formData.website,
        description: formData.description,
        email: user.email,
        userFullName: user.user_metadata?.full_name || '',
        currentStep: 2
      }));

      console.log('Campaign created successfully:', campaign);
      
      // Navigate to Step 2 (Committee Search)
      navigate('/CommitteeSearch');

    } catch (error) {
      console.error('Failed to create campaign:', error);
      setValidationErrors({
        submit: error.message || 'Failed to create campaign. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: 'hsl(var(--crypto-navy))'}}>'
      <CampaignAuthNav />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full">
          <div className="bg-card rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4"></div>
              <h2 className="font-bold text-foreground mb-2" style={{fontSize: 'var(--text-heading-xl)'}}>
                Campaign Information
              </h2>
              <p className="text-muted-foreground">
                Step 1: Let's set up your campaign details
              </p>
            </div>

            {/* Error Display */}
            {validationErrors.submit && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">
                  {validationErrors.submit}
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campaign Name */}
              <div>
                <label htmlFor="campaignName" className="block text-sm font-medium text-foreground mb-2">
                  Campaign Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="campaignName"
                    name="campaignName"
                    type="text"
                    value={formData.campaignName}
                    onChange={handleChange}
                    className={`pl-10 ${validationErrors.campaignName ? 'border-destructive' : ''}`}
                    placeholder="e.g., Smith for Congress 2024"
                    disabled={loading}
                  />
                </div>
                {validationErrors.campaignName && (
                  <p className="mt-1 text-xs text-destructive">{validationErrors.campaignName}</p>
                )}
              </div>

              {/* Website URL */}
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-foreground mb-2">
                  Campaign Website *
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange}
                    className={`pl-10 ${validationErrors.website ? 'border-destructive' : ''}`}
                    placeholder="https://www.yourcampaign.com"
                    disabled={loading}
                  />
                </div>
                {validationErrors.website && (
                  <p className="mt-1 text-xs text-destructive">{validationErrors.website}</p>
                )}
              </div>

              {/* Campaign Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Campaign Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Brief description of your campaign..."
                    rows={4}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Creating Campaign...
                  </>
                ) : (
                  'Continue to Committee Search →'
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium text-foreground mb-2">
What happens next?
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• We'll search for your FEC committee information</li>
                <li>• Connect your bank account securely via Plaid</li>
                <li>• Match your website's styling to your donation form</li>
                <li>• Generate your embed code and go live!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignInformationForm;