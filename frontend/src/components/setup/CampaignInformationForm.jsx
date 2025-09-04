import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Building2, User, Mail, Phone, AlertCircle } from 'lucide-react';
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
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPhone: '',
  });
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.campaignName.trim()) {
      errors.campaignName = 'Campaign name is required';
    }

    if (!formData.adminFirstName.trim()) {
      errors.adminFirstName = 'Admin first name is required';
    }

    if (!formData.adminLastName.trim()) {
      errors.adminLastName = 'Admin last name is required';
    }

    if (!formData.adminEmail.trim()) {
      errors.adminEmail = 'Admin email is required';
    } else {
      // Basic email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.adminEmail.trim())) {
        errors.adminEmail = 'Please enter a valid email address';
      }
    }

    if (!formData.adminPhone.trim()) {
      errors.adminPhone = 'Admin phone is required';
    } else {
      // Basic phone validation (US format)
      const phonePattern = /^[\+]?[1]?[\s]?[\(]?[\d{3}]?[\)]?[\s]?[\d{3}]?[\-]?[\d{4}]$/;
      if (!phonePattern.test(formData.adminPhone.trim())) {
        errors.adminPhone = 'Please enter a valid phone number';
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
            description: '',
            email: formData.adminEmail,
            user_id: user.id,
            status: 'setup',
            goal_amount: 0,
            current_amount: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Store form data in localStorage for next steps
      localStorage.setItem(
        'campaignSetupData',
        JSON.stringify({
          campaignId: campaign.id,
          campaignName: formData.campaignName,
          adminFirstName: formData.adminFirstName,
          adminLastName: formData.adminLastName,
          adminEmail: formData.adminEmail,
          adminPhone: formData.adminPhone,
          currentStep: 2,
        })
      );

      console.log('Campaign created successfully:', campaign);

      // Navigate to Step 2 (Committee Search)
      navigate('/CommitteeSearch');
    } catch (error) {
      console.error('Failed to create campaign:', error);
      setValidationErrors({
        submit: error.message || 'Failed to create campaign. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--crypto-navy))' }}>
      <CampaignAuthNav />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full">
          <div className="bg-card rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4"></div>
              <h2
                className="font-bold text-foreground mb-2"
                style={{ fontSize: 'var(--text-heading-xl)' }}
              >
                Campaign Information
              </h2>
              <p className="text-muted-foreground">Step 1: Let's set up your campaign details</p>
            </div>

            {/* Error Display */}
            {validationErrors.submit && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">{validationErrors.submit}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campaign Name */}
              <div>
                <label
                  htmlFor="campaignName"
                  className="block text-base font-medium text-foreground mb-2"
                >
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
                    placeholder=""
                    disabled={loading}
                  />
                </div>
                {validationErrors.campaignName && (
                  <p className="mt-1 text-xs text-destructive">{validationErrors.campaignName}</p>
                )}
              </div>

              {/* Admin First Name */}
              <div>
                <label
                  htmlFor="adminFirstName"
                  className="block text-base font-medium text-foreground mb-2"
                >
                  Admin First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="adminFirstName"
                    name="adminFirstName"
                    type="text"
                    value={formData.adminFirstName}
                    onChange={handleChange}
                    className={`pl-10 ${validationErrors.adminFirstName ? 'border-destructive' : ''}`}
                    placeholder=""
                    disabled={loading}
                  />
                </div>
                {validationErrors.adminFirstName && (
                  <p className="mt-1 text-xs text-destructive">{validationErrors.adminFirstName}</p>
                )}
              </div>

              {/* Admin Last Name */}
              <div>
                <label
                  htmlFor="adminLastName"
                  className="block text-base font-medium text-foreground mb-2"
                >
                  Admin Last Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="adminLastName"
                    name="adminLastName"
                    type="text"
                    value={formData.adminLastName}
                    onChange={handleChange}
                    className={`pl-10 ${validationErrors.adminLastName ? 'border-destructive' : ''}`}
                    placeholder=""
                    disabled={loading}
                  />
                </div>
                {validationErrors.adminLastName && (
                  <p className="mt-1 text-xs text-destructive">{validationErrors.adminLastName}</p>
                )}
              </div>

              {/* Admin Email */}
              <div>
                <label
                  htmlFor="adminEmail"
                  className="block text-base font-medium text-foreground mb-2"
                >
                  Admin Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    className={`pl-10 ${validationErrors.adminEmail ? 'border-destructive' : ''}`}
                    placeholder=""
                    disabled={loading}
                  />
                </div>
                {validationErrors.adminEmail && (
                  <p className="mt-1 text-xs text-destructive">{validationErrors.adminEmail}</p>
                )}
              </div>

              {/* Admin Phone */}
              <div>
                <label
                  htmlFor="adminPhone"
                  className="block text-base font-medium text-foreground mb-2"
                >
                  Admin Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="adminPhone"
                    name="adminPhone"
                    type="tel"
                    value={formData.adminPhone}
                    onChange={handleChange}
                    className={`pl-10 ${validationErrors.adminPhone ? 'border-destructive' : ''}`}
                    placeholder=""
                    disabled={loading}
                  />
                </div>
                {validationErrors.adminPhone && (
                  <p className="mt-1 text-xs text-destructive">{validationErrors.adminPhone}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Creating Campaign...
                  </>
                ) : (
                  'Continue to Committee Search'
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-base font-medium text-foreground mb-2">What happens next?</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>We'll search for your FEC committee information</li>
                <li>Connect your bank account securely via Plaid</li>
                <li>Match your website's styling to your donation form</li>
                <li>Generate your embed code and go live!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignInformationForm;
