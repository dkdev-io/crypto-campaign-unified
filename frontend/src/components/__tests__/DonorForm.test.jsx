import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '../../utils/test-utils';
import DonorForm from '../DonorForm';
import { supabase, configureSupabaseMock, mockData } from '../../__mocks__/supabase';
import web3Service, { configureWeb3Mock } from '../../__mocks__/web3Service';

// Mock the dependencies
vi.mock('../lib/supabase', () => ({ supabase }));
vi.mock('../lib/web3', () => ({ default: web3Service }));

describe('DonorForm', () => {
  const defaultProps = {
    campaignId: 'test-campaign-1'
  };

  beforeEach(() => {
    configureSupabaseMock.reset();
    configureWeb3Mock.reset();
    vi.clearAllTimers();
  });

  describe('Component Loading', () => {
    it('shows loading state initially', () => {
      render(<DonorForm {...defaultProps} />);
      expect(screen.getByText('Loading campaign...')).toBeInTheDocument();
    });

    it('loads campaign data on mount', async () => {
      render(<DonorForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('campaigns');
      });
      
      await waitFor(() => {
        expect(screen.getByText('Test Campaign')).toBeInTheDocument();
      });
    });

    it('shows default form when no campaign ID provided', () => {
      render(<DonorForm campaignId={null} />);
      
      expect(screen.getByText('Support Our Campaign')).toBeInTheDocument();
    });

    it('displays error when campaign loading fails', async () => {
      configureSupabaseMock.setCampaignResponse(null, { message: 'Campaign not found' });
      
      render(<DonorForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Unable to load campaign/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Rendering', () => {
    beforeEach(async () => {
      render(<DonorForm {...defaultProps} />);
      await waitFor(() => screen.getByText('Test Campaign'));
    });

    it('renders all required form fields', () => {
      expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Street Address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('City')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('State')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('ZIP')).toBeInTheDocument();
      expect(screen.getByLabelText(/Employer/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Occupation/)).toBeInTheDocument();
    });

    it('renders campaign information correctly', () => {
      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
      expect(screen.getByText('Candidate: John Doe')).toBeInTheDocument();
    });

    it('renders suggested amounts', () => {
      expect(screen.getByText('$25')).toBeInTheDocument();
      expect(screen.getByText('$50')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();
      expect(screen.getByText('$250')).toBeInTheDocument();
    });

    it('renders payment method options', () => {
      expect(screen.getByText('💳 Traditional Payment')).toBeInTheDocument();
      expect(screen.getByText('🔗 Crypto Payment (ETH)')).toBeInTheDocument();
    });

    it('renders compliance checkbox', () => {
      expect(screen.getByText(/I certify that I am a U.S. citizen/)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    let user;

    beforeEach(async () => {
      user = userEvent.setup();
      render(<DonorForm {...defaultProps} />);
      await waitFor(() => screen.getByText('Test Campaign'));
    });

    it('prevents submission with empty required fields', async () => {
      const submitButton = screen.getByText('💳 Submit Traditional Contribution');
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      const fullNameInput = screen.getByLabelText(/Full Name/);
      expect(fullNameInput).toBeRequired();
      expect(fullNameInput.value).toBe('');
    });

    it('validates email format', async () => {
      const emailInput = screen.getByLabelText(/Email/);
      await user.type(emailInput, 'invalid-email');
      
      expect(emailInput).toBeInvalid();
    });

    it('enforces maximum donation limit', async () => {
      const amountInput = screen.getByPlaceholderText('Custom amount');
      await user.type(amountInput, '5000'); // Over limit
      
      await waitFor(() => {
        expect(screen.getByText(/Maximum contribution is \$3300/)).toBeInTheDocument();
      });
    });

    it('validates amount is positive', async () => {
      const amountInput = screen.getByPlaceholderText('Custom amount');
      await user.type(amountInput, '-100');
      
      expect(amountInput).toBeInvalid();
    });

    it('requires compliance checkbox to be checked', async () => {
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeRequired();
    });
  });

  describe('Suggested Amount Selection', () => {
    let user;

    beforeEach(async () => {
      user = userEvent.setup();
      render(<DonorForm {...defaultProps} />);
      await waitFor(() => screen.getByText('Test Campaign'));
    });

    it('selects suggested amount when clicked', async () => {
      const amount50Button = screen.getByText('$50');
      await user.click(amount50Button);
      
      const amountInput = screen.getByPlaceholderText('Custom amount');
      expect(amountInput.value).toBe('50');
    });

    it('highlights selected amount', async () => {
      const amount100Button = screen.getByText('$100');
      await user.click(amount100Button);
      
      expect(amount100Button).toHaveStyle({ background: '#2a2a72', color: 'white' });
    });

    it('allows custom amount entry', async () => {
      const amountInput = screen.getByPlaceholderText('Custom amount');
      await user.type(amountInput, '75');
      
      expect(amountInput.value).toBe('75');
    });
  });

  describe('Payment Method Selection', () => {
    let user;

    beforeEach(async () => {
      user = userEvent.setup();
      render(<DonorForm {...defaultProps} />);
      await waitFor(() => screen.getByText('Test Campaign'));
    });

    it('defaults to traditional payment', () => {
      const traditionalRadio = screen.getByDisplayValue('traditional');
      expect(traditionalRadio).toBeChecked();
    });

    it('switches to crypto payment when selected', async () => {
      const cryptoRadio = screen.getByDisplayValue('crypto');
      await user.click(cryptoRadio);
      
      expect(cryptoRadio).toBeChecked();
      expect(screen.getByText('🔗 Crypto Payment via Smart Contract')).toBeInTheDocument();
    });

    it('shows wallet connection when crypto selected', async () => {
      const cryptoRadio = screen.getByDisplayValue('crypto');
      await user.click(cryptoRadio);
      
      expect(screen.getByText('🦊 Connect MetaMask Wallet')).toBeInTheDocument();
    });

    it('hides traditional submit button when crypto selected', async () => {
      const cryptoRadio = screen.getByDisplayValue('crypto');
      await user.click(cryptoRadio);
      
      expect(screen.queryByText('💳 Submit Traditional Contribution')).not.toBeInTheDocument();
    });
  });

  describe('Traditional Payment Submission', () => {
    let user;

    beforeEach(async () => {
      user = userEvent.setup();
      render(<DonorForm {...defaultProps} />);
      await waitFor(() => screen.getByText('Test Campaign'));
    });

    const fillRequiredFields = async () => {
      await user.type(screen.getByLabelText(/Full Name/), 'Jane Smith');
      await user.type(screen.getByLabelText(/Email/), 'jane@example.com');
      await user.type(screen.getByPlaceholderText('Street Address'), '123 Main St');
      await user.type(screen.getByPlaceholderText('City'), 'Anytown');
      await user.type(screen.getByPlaceholderText('State'), 'CA');
      await user.type(screen.getByPlaceholderText('ZIP'), '12345');
      await user.type(screen.getByLabelText(/Employer/), 'Test Corp');
      await user.type(screen.getByLabelText(/Occupation/), 'Engineer');
      await user.type(screen.getByPlaceholderText('Custom amount'), '100');
      await user.click(screen.getByRole('checkbox'));
    };

    it('submits form with valid data', async () => {
      await fillRequiredFields();
      
      const submitButton = screen.getByText('💳 Submit Traditional Contribution');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('form_submissions');
      });
    });

    it('shows success message after submission', async () => {
      await fillRequiredFields();
      
      const submitButton = screen.getByText('💳 Submit Traditional Contribution');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('🎉 Thank You!')).toBeInTheDocument();
      });
    });

    it('disables submit button during submission', async () => {
      await fillRequiredFields();
      
      const submitButton = screen.getByText('💳 Submit Traditional Contribution');
      await user.click(submitButton);
      
      expect(screen.getByText('⏳ Processing Traditional Payment...')).toBeInTheDocument();
    });

    it('handles submission errors gracefully', async () => {
      configureSupabaseMock.setSubmissionResponse(null, { message: 'Database error' });
      
      await fillRequiredFields();
      
      const submitButton = screen.getByText('💳 Submit Traditional Contribution');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Database error/)).toBeInTheDocument();
      });
    });

    it('validates campaign ID before submission', async () => {
      render(<DonorForm campaignId={null} />);
      
      await fillRequiredFields();
      
      const submitButton = screen.getByText('💳 Submit Traditional Contribution');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/No campaign ID found/)).toBeInTheDocument();
      });
    });
  });

  describe('Crypto Payment Flow', () => {
    let user;

    beforeEach(async () => {
      user = userEvent.setup();
      configureWeb3Mock.setConnected(true);
      render(<DonorForm {...defaultProps} />);
      await waitFor(() => screen.getByText('Test Campaign'));
      
      // Switch to crypto payment
      const cryptoRadio = screen.getByDisplayValue('crypto');
      await user.click(cryptoRadio);
    });

    it('shows crypto payment section when selected', () => {
      expect(screen.getByText('🔗 Crypto Payment via Smart Contract')).toBeInTheDocument();
      expect(screen.getByText('✅ FEC-compliant smart contract')).toBeInTheDocument();
    });

    it('shows USD to ETH conversion estimate', async () => {
      await user.type(screen.getByPlaceholderText('Custom amount'), '300');
      
      await waitFor(() => {
        expect(screen.getByText(/≈0.1000 ETH/)).toBeInTheDocument(); // $300 / $3000 per ETH
      });
    });

    it('requires wallet connection for crypto payment', async () => {
      configureWeb3Mock.setConnected(false);
      
      expect(screen.getByText('🔗 Please connect your wallet above')).toBeInTheDocument();
    });

    it('shows KYC warning for unverified wallets', async () => {
      configureWeb3Mock.setKYCStatus(false);
      
      // Simulate wallet connection
      web3Service._triggerAccountChange('0x123...');
      
      await waitFor(() => {
        expect(screen.getByText('⚠️ KYC Required')).toBeInTheDocument();
      });
    });

    it('processes crypto payment successfully', async () => {
      configureWeb3Mock.setConnected(true);
      configureWeb3Mock.setKYCStatus(true);
      
      await user.type(screen.getByPlaceholderText('Custom amount'), '100');
      
      // Fill required form fields
      await user.type(screen.getByLabelText(/Full Name/), 'Jane Smith');
      await user.type(screen.getByLabelText(/Email/), 'jane@example.com');
      await user.type(screen.getByPlaceholderText('Street Address'), '123 Main St');
      await user.type(screen.getByPlaceholderText('City'), 'Anytown');
      await user.type(screen.getByPlaceholderText('State'), 'CA');
      await user.type(screen.getByPlaceholderText('ZIP'), '12345');
      await user.type(screen.getByLabelText(/Employer/), 'Test Corp');
      await user.type(screen.getByLabelText(/Occupation/), 'Engineer');
      await user.click(screen.getByRole('checkbox'));
      
      // Simulate wallet connection
      web3Service._triggerAccountChange('0x123...');
      
      await waitFor(() => {
        const payButton = screen.getByText(/Pay \$100 via Smart Contract/);
        expect(payButton).toBeInTheDocument();
      });
    });

    it('handles crypto payment failures', async () => {
      configureWeb3Mock.setTransactionResult(false, 'Insufficient funds');
      configureWeb3Mock.setConnected(true);
      
      await user.type(screen.getByPlaceholderText('Custom amount'), '100');
      
      // Simulate wallet connection
      web3Service._triggerAccountChange('0x123...');
      
      await waitFor(() => {
        expect(screen.getByText(/Insufficient funds/)).toBeInTheDocument();
      });
    });

    it('shows transaction hash after successful crypto payment', async () => {
      configureWeb3Mock.setConnected(true);
      configureWeb3Mock.setTransactionResult(true);
      
      // Fill form and process payment
      await user.type(screen.getByPlaceholderText('Custom amount'), '100');
      
      // Simulate successful crypto transaction
      const mockTx = { txHash: '0xabc123...', blockNumber: 18500000 };
      
      await waitFor(() => {
        // Check if etherscan link is created
        const etherscanLink = screen.getByText(/0xabc123/);
        expect(etherscanLink).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    let user;

    beforeEach(async () => {
      user = userEvent.setup();
    });

    it('displays network errors', async () => {
      // Mock network failure
      configureSupabaseMock.setCampaignResponse(null, { message: 'Network error' });
      
      render(<DonorForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it('handles missing campaign gracefully', async () => {
      configureSupabaseMock.setCampaignResponse(null, { message: 'Campaign not found' });
      
      render(<DonorForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Campaign not found/)).toBeInTheDocument();
      });
    });

    it('shows MetaMask not found error', async () => {
      configureWeb3Mock.setMetaMaskAvailable(false);
      
      render(<DonorForm {...defaultProps} />);
      await waitFor(() => screen.getByText('Test Campaign'));
      
      const cryptoRadio = screen.getByDisplayValue('crypto');
      await user.click(cryptoRadio);
      
      expect(screen.getByText('🦊 MetaMask Required')).toBeInTheDocument();
      expect(screen.getByText('📥 Install MetaMask →')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<DonorForm {...defaultProps} />);
      await waitFor(() => screen.getByText('Test Campaign'));
    });

    it('has proper form labels', () => {
      expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Employer/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Occupation/)).toBeInTheDocument();
    });

    it('has proper ARIA attributes for required fields', () => {
      const fullNameInput = screen.getByLabelText(/Full Name/);
      expect(fullNameInput).toBeRequired();
      expect(fullNameInput).toHaveAttribute('aria-required', 'true');
    });

    it('has proper button roles and text', () => {
      const submitButton = screen.getByRole('button', { name: /Submit Traditional Contribution/ });
      expect(submitButton).toBeInTheDocument();
    });

    it('maintains focus management during state changes', async () => {
      const user = userEvent.setup();
      const amountInput = screen.getByPlaceholderText('Custom amount');
      
      amountInput.focus();
      await user.type(amountInput, '100');
      
      expect(amountInput).toHaveFocus();
    });
  });
});