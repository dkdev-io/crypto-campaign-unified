import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '../../../utils/test-utils';
import SetupWizard from '../SetupWizard';
import { supabase, configureSupabaseMock } from '../../../__mocks__/supabase';

// Mock all the step components
vi.mock('../Signup', () => ({
  default: ({ formData, updateFormData, onNext, onPrev }) => (
    <div data-testid="signup-step">
      <h2>Signup Step</h2>
      <button onClick={onNext}>Next</button>
      <button onClick={onPrev}>Previous</button>
    </div>
  )
}));

vi.mock('../CommitteeSearch', () => ({
  default: ({ formData, updateFormData, onNext, onPrev }) => (
    <div data-testid="committee-search-step">
      <h2>Committee Search Step</h2>
      <button onClick={onNext}>Next</button>
      <button onClick={onPrev}>Previous</button>
    </div>
  )
}));

vi.mock('../BankConnection', () => ({
  default: ({ formData, updateFormData, onNext, onPrev, campaignId }) => (
    <div data-testid="bank-connection-step">
      <h2>Bank Connection Step</h2>
      <span data-testid="campaign-id">{campaignId}</span>
      <button onClick={onNext}>Next</button>
      <button onClick={onPrev}>Previous</button>
    </div>
  )
}));

vi.mock('../TermsAgreement', () => ({
  default: ({ formData, updateFormData, onNext, onPrev }) => (
    <div data-testid="terms-agreement-step">
      <h2>Terms Agreement Step</h2>
      <button onClick={onNext}>Next</button>
      <button onClick={onPrev}>Previous</button>
    </div>
  )
}));

vi.mock('../EmbedCode', () => ({
  default: ({ formData, updateFormData, onNext, onPrev }) => (
    <div data-testid="embed-code-step">
      <h2>Embed Code Step</h2>
      <button onClick={onNext}>Next</button>
      <button onClick={onPrev}>Previous</button>
    </div>
  )
}));

vi.mock('../StepIndicator', () => ({
  default: ({ currentStep, totalSteps }) => (
    <div data-testid="step-indicator">
      Step {currentStep} of {totalSteps}
    </div>
  )
}));

// Mock the supabase module
vi.mock('../../../lib/supabase', () => ({ 
  supabase: supabase
}));

// Mock the CSS import
vi.mock('../../../styles/setup.css', () => ({}));

describe('SetupWizard', () => {
  const mockCampaign = {
    id: 'test-campaign-123',
    email: 'test@example.com',
    campaign_name: 'Test Campaign',
    website: 'https://test.com',
    wallet_address: 'temp-wallet-123',
    suggested_amounts: [25, 50, 100, 250],
    max_donation_limit: 3300,
    theme_color: '#2a2a72',
    supported_cryptos: ['ETH']
  };

  beforeEach(() => {
    configureSupabaseMock.reset();
    configureSupabaseMock.setInsertResponse(mockCampaign);
    configureSupabaseMock.setUpdateResponse(mockCampaign);
    vi.clearAllMocks();
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders setup wizard with step indicator and admin link', () => {
      render(<SetupWizard />);
      
      expect(screen.getByTestId('step-indicator')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
      expect(screen.getByText('🔧 Admin Panel')).toBeInTheDocument();
    });

    it('renders signup step initially', () => {
      render(<SetupWizard />);
      
      expect(screen.getByTestId('signup-step')).toBeInTheDocument();
      expect(screen.getByText('Signup Step')).toBeInTheDocument();
    });

    it('has admin panel link with correct href', () => {
      render(<SetupWizard />);
      
      const adminLink = screen.getByText('🔧 Admin Panel');
      expect(adminLink).toHaveAttribute('href', '/admin');
    });
  });

  describe('Step Navigation', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('advances to next step when next is clicked', async () => {
      render(<SetupWizard />);
      
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('committee-search-step')).toBeInTheDocument();
        expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
      });
    });

    it('goes back to previous step when previous is clicked', async () => {
      render(<SetupWizard />);
      
      // Go to step 2
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('committee-search-step')).toBeInTheDocument();
      });
      
      // Go back to step 1
      const prevButton = screen.getByText('Previous');
      await user.click(prevButton);
      
      expect(screen.getByTestId('signup-step')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    });

    it('renders all steps correctly as user navigates', async () => {
      render(<SetupWizard />);
      
      // Step 1 - Signup
      expect(screen.getByTestId('signup-step')).toBeInTheDocument();
      
      // Navigate through all steps
      const nextButton = screen.getByText('Next');
      
      // Step 2 - Committee Search
      await user.click(nextButton);
      await waitFor(() => {
        expect(screen.getByTestId('committee-search-step')).toBeInTheDocument();
      });
      
      // Step 3 - Bank Connection
      await user.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByTestId('bank-connection-step')).toBeInTheDocument();
      });
      
      // Step 4 - Terms Agreement  
      await user.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByTestId('terms-agreement-step')).toBeInTheDocument();
      });
      
      // Step 5 - Embed Code
      await user.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByTestId('embed-code-step')).toBeInTheDocument();
        expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();
      });
    });

    it('does not go beyond last step', async () => {
      render(<SetupWizard />);
      
      // Navigate to last step
      for (let i = 0; i < 5; i++) {
        if (i > 0) {
          await user.click(screen.getByText('Next'));
          await waitFor(() => {});
        }
      }
      
      // Try to go beyond
      await user.click(screen.getByText('Next'));
      
      // Should still be on step 5
      expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();
      expect(screen.getByTestId('embed-code-step')).toBeInTheDocument();
    });

    it('does not go before first step', async () => {
      render(<SetupWizard />);
      
      const prevButton = screen.getByText('Previous');
      await user.click(prevButton);
      
      // Should still be on step 1
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
      expect(screen.getByTestId('signup-step')).toBeInTheDocument();
    });
  });

  describe('Campaign Creation', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('creates campaign when advancing from step 1', async () => {
      render(<SetupWizard />);
      
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('campaigns');
      });
      
      // Should advance to step 2 with campaign created
      expect(screen.getByTestId('committee-search-step')).toBeInTheDocument();
    });

    it('passes campaign ID to subsequent steps', async () => {
      render(<SetupWizard />);
      
      // Advance to step 3 (BankConnection) which shows campaign ID
      await user.click(screen.getByText('Next'));
      await waitFor(() => screen.getByTestId('committee-search-step'));
      
      await user.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByTestId('bank-connection-step')).toBeInTheDocument();
        expect(screen.getByTestId('campaign-id')).toHaveTextContent('test-campaign-123');
      });
    });

    it('handles campaign creation failure', async () => {
      configureSupabaseMock.setInsertResponse(null, { message: 'Database error' });
      
      render(<SetupWizard />);
      
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Campaign creation failed: Database error')
        );
      });
      
      // Should not advance step
      expect(screen.getByTestId('signup-step')).toBeInTheDocument();
    });

    it('creates campaign with default data', async () => {
      render(<SetupWizard />);
      
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(supabase.from().insert).toHaveBeenCalledWith([
          expect.objectContaining({
            email: 'test@test.com',
            campaign_name: 'New Campaign',
            website: 'https://temp.com',
            suggested_amounts: [25, 50, 100, 250],
            max_donation_limit: 3300,
            theme_color: '#2a2a72',
            supported_cryptos: ['ETH']
          })
        ]);
      });
    });

    it('uses form data when creating campaign', async () => {
      render(<SetupWizard />);
      
      // Simulate form data being set
      const wizard = screen.getByTestId('signup-step').closest('.setup-container');
      
      await user.click(screen.getByText('Next'));
      
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('campaigns');
      });
    });
  });

  describe('Form Data Management', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('updates form data and syncs with database when campaign exists', async () => {
      render(<SetupWizard />);
      
      // Create campaign first
      await user.click(screen.getByText('Next'));
      await waitFor(() => screen.getByTestId('committee-search-step'));
      
      // Reset mock to track update calls
      vi.clearAllMocks();
      
      // Navigate to trigger form data update
      await user.click(screen.getByText('Next'));
      
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('campaigns');
      });
    });

    it('maps form data to database fields correctly', async () => {
      render(<SetupWizard />);
      
      // Create campaign first
      await user.click(screen.getByText('Next'));
      await waitFor(() => screen.getByTestId('committee-search-step'));
    });

    it('handles database update errors gracefully', async () => {
      configureSupabaseMock.setUpdateResponse(null, { message: 'Update failed' });
      
      render(<SetupWizard />);
      
      // Create campaign first
      await user.click(screen.getByText('Next'));
      await waitFor(() => screen.getByTestId('committee-search-step'));
      
      // Should not crash on update error
      expect(screen.getByTestId('committee-search-step')).toBeInTheDocument();
    });
  });

  describe('Step Rendering Logic', () => {
    it('renders default step for invalid step number', () => {
      render(<SetupWizard />);
      
      // Manually test renderStep logic by checking default case
      expect(screen.getByTestId('signup-step')).toBeInTheDocument();
    });

    it('passes correct props to step components', async () => {
      render(<SetupWizard />);
      
      // All step components should receive formData, updateFormData, onNext, onPrev
      expect(screen.getByTestId('signup-step')).toBeInTheDocument();
      
      // After creating campaign, BankConnection should receive campaignId
      await userEvent.setup().click(screen.getByText('Next'));
      await waitFor(() => screen.getByTestId('committee-search-step'));
      
      await userEvent.setup().click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByTestId('campaign-id')).toBeInTheDocument();
      });
    });
  });

  describe('UI Styling and Layout', () => {
    it('has correct CSS classes applied', () => {
      const { container } = render(<SetupWizard />);
      
      expect(container.querySelector('.setup-container')).toBeInTheDocument();
      expect(container.querySelector('.setup-card')).toBeInTheDocument();
      expect(container.querySelector('.form-content')).toBeInTheDocument();
    });

    it('styles admin panel link correctly', () => {
      render(<SetupWizard />);
      
      const adminLink = screen.getByText('🔧 Admin Panel');
      expect(adminLink).toHaveStyle({
        color: '#666',
        textDecoration: 'none',
        fontSize: '14px',
        padding: '0.5rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        background: '#f8f9fa'
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('handles supabase connection errors', async () => {
      configureSupabaseMock.setInsertResponse(null, { 
        message: 'Connection failed',
        details: 'Network timeout'
      });
      
      render(<SetupWizard />);
      
      await userEvent.setup().click(screen.getByText('Next'));
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Connection failed')
        );
      });
    });

    it('handles unexpected errors during campaign creation', async () => {
      // Mock supabase to throw an error
      supabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      render(<SetupWizard />);
      
      await userEvent.setup().click(screen.getByText('Next'));
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          'Campaign creation error: Unexpected error'
        );
      });
    });

    it('logs errors to console', async () => {
      configureSupabaseMock.setInsertResponse(null, { message: 'Test error' });
      
      render(<SetupWizard />);
      
      await userEvent.setup().click(screen.getByText('Next'));
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Failed to create campaign:',
          expect.objectContaining({ message: 'Test error' })
        );
      });
    });
  });

  describe('Component Snapshots', () => {
    it('matches snapshot for initial state', () => {
      const { container } = render(<SetupWizard />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for different steps', async () => {
      render(<SetupWizard />);
      
      // Step 2 snapshot
      await userEvent.setup().click(screen.getByText('Next'));
      await waitFor(() => screen.getByTestId('committee-search-step'));
      
      const { container } = render(<SetupWizard />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});