import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '../../../utils/test-utils';
import BankConnection from '../BankConnection';

// Mock the plaid service
const mockPlaidService = {
  constructor: {
    loadPlaidScript: vi.fn()
  },
  getBankAccountInfo: vi.fn(),
  initializePlaidLink: vi.fn(),
  removeBankAccount: vi.fn()
};

vi.mock('../../../lib/plaid-service.js', () => ({
  plaidService: mockPlaidService
}));

describe('BankConnection', () => {
  const defaultProps = {
    formData: {
      email: 'test@example.com'
    },
    updateFormData: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    campaignId: 'test-campaign-123'
  };

  const mockBankInfo = {
    isVerified: true,
    accountName: 'Test Checking',
    lastFour: '1234',
    accountId: 'account-123',
    details: {
      institution_name: 'Test Bank',
      created_at: '2024-01-01T00:00:00.000Z'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPlaidService.constructor.loadPlaidScript.mockResolvedValue(undefined);
    mockPlaidService.getBankAccountInfo.mockResolvedValue(null);
    mockPlaidService.initializePlaidLink.mockResolvedValue({
      open: vi.fn()
    });
    mockPlaidService.removeBankAccount.mockResolvedValue(undefined);
    
    // Mock global Plaid
    global.window.Plaid = true;
    
    // Mock event listeners
    global.window.addEventListener = vi.fn();
    global.window.removeEventListener = vi.fn();
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders bank connection component with title and description', () => {
      render(<BankConnection {...defaultProps} />);
      
      expect(screen.getByText(/Connect Bank Account - Step 3/)).toBeInTheDocument();
      expect(screen.getByText(/Securely connect your campaign's bank account/)).toBeInTheDocument();
    });

    it('shows no bank account connected state initially', () => {
      render(<BankConnection {...defaultProps} />);
      
      expect(screen.getByText('No Bank Account Connected')).toBeInTheDocument();
      expect(screen.getByText(/Connect your campaign's bank account/)).toBeInTheDocument();
      expect(screen.getByText('🔗 Connect Bank Account')).toBeInTheDocument();
    });

    it('renders security information section', () => {
      render(<BankConnection {...defaultProps} />);
      
      expect(screen.getByText('🔒 Your Security is Our Priority')).toBeInTheDocument();
      expect(screen.getByText(/Bank connections are powered by Plaid/)).toBeInTheDocument();
      expect(screen.getByText(/Your login credentials are never stored/)).toBeInTheDocument();
    });

    it('renders how it works section', () => {
      render(<BankConnection {...defaultProps} />);
      
      expect(screen.getByText('💡 How Bank Connection Works')).toBeInTheDocument();
      expect(screen.getByText('Connect Securely')).toBeInTheDocument();
      expect(screen.getByText('Select Account')).toBeInTheDocument();
      expect(screen.getByText('Start Processing')).toBeInTheDocument();
    });

    it('shows development skip option', () => {
      render(<BankConnection {...defaultProps} />);
      
      expect(screen.getByText('🔧 Development Mode')).toBeInTheDocument();
      expect(screen.getByText('⚠️ Skip Bank Connection (Dev Only)')).toBeInTheDocument();
    });
  });

  describe('Bank Account Status', () => {
    it('shows connected state when bank account is verified', async () => {
      mockPlaidService.getBankAccountInfo.mockResolvedValue(mockBankInfo);
      
      render(<BankConnection {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('✅ Bank Account Connected')).toBeInTheDocument();
        expect(screen.getByText('Test Bank')).toBeInTheDocument();
        expect(screen.getByText(/Test Checking \(\.\.\.1234\)/)).toBeInTheDocument();
        expect(screen.getByText('🗑️ Remove Bank Account')).toBeInTheDocument();
      });
    });

    it('updates form data when bank account is verified', async () => {
      mockPlaidService.getBankAccountInfo.mockResolvedValue(mockBankInfo);
      
      render(<BankConnection {...defaultProps} />);
      
      await waitFor(() => {
        expect(defaultProps.updateFormData).toHaveBeenCalledWith({
          bankAccountVerified: true,
          bankAccountInfo: mockBankInfo
        });
      });
    });

    it('does not update form data when bank account is not verified', async () => {
      mockPlaidService.getBankAccountInfo.mockResolvedValue({ isVerified: false });
      
      render(<BankConnection {...defaultProps} />);
      
      await waitFor(() => {
        expect(defaultProps.updateFormData).not.toHaveBeenCalled();
      });
    });
  });

  describe('Plaid Integration', () => {
    it('loads Plaid script on mount', async () => {
      render(<BankConnection {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockPlaidService.constructor.loadPlaidScript).toHaveBeenCalled();
      });
    });

    it('shows loading state when Plaid is not ready', () => {
      global.window.Plaid = undefined;
      
      render(<BankConnection {...defaultProps} />);
      
      expect(screen.getByText('⏳ Loading...')).toBeInTheDocument();
      expect(screen.getByText('Loading Plaid SDK...')).toBeInTheDocument();
    });

    it('enables connect button when Plaid is ready', async () => {
      render(<BankConnection {...defaultProps} />);
      
      await waitFor(() => {
        const connectButton = screen.getByText('🔗 Connect Bank Account');
        expect(connectButton).not.toBeDisabled();
      });
    });

    it('initiates Plaid Link when connect button is clicked', async () => {
      const user = userEvent.setup();
      const mockLinkHandler = { open: vi.fn() };
      mockPlaidService.initializePlaidLink.mockResolvedValue(mockLinkHandler);
      
      render(<BankConnection {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('🔗 Connect Bank Account')).not.toBeDisabled();
      });
      
      const connectButton = screen.getByText('🔗 Connect Bank Account');
      await user.click(connectButton);
      
      await waitFor(() => {
        expect(mockPlaidService.initializePlaidLink).toHaveBeenCalledWith(
          'test-campaign-123',
          'test@example.com'
        );
        expect(mockLinkHandler.open).toHaveBeenCalled();
      });
    });

    it('handles Plaid initialization errors', async () => {
      const user = userEvent.setup();
      mockPlaidService.initializePlaidLink.mockRejectedValue(
        new Error('backend integration required')
      );
      
      render(<BankConnection {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('🔗 Connect Bank Account')).not.toBeDisabled();
      });
      
      const connectButton = screen.getByText('🔗 Connect Bank Account');
      await user.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Plaid backend integration is required/)).toBeInTheDocument();
      });
    });

    it('shows loading state during connection process', async () => {
      const user = userEvent.setup();
      
      // Mock a slow initialization
      mockPlaidService.initializePlaidLink.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ open: vi.fn() }), 100))
      );
      
      render(<BankConnection {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('🔗 Connect Bank Account')).not.toBeDisabled();
      });
      
      const connectButton = screen.getByText('🔗 Connect Bank Account');
      await user.click(connectButton);
      
      expect(screen.getByText('⏳ Connecting...')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('sets up Plaid event listeners on mount', () => {
      render(<BankConnection {...defaultProps} />);
      
      expect(window.addEventListener).toHaveBeenCalledWith('plaidLinkSuccess', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('plaidLinkExit', expect.any(Function));
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(<BankConnection {...defaultProps} />);
      
      unmount();
      
      expect(window.removeEventListener).toHaveBeenCalledWith('plaidLinkSuccess', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('plaidLinkExit', expect.any(Function));
    });
  });

  describe('Bank Account Removal', () => {
    it('removes bank account when remove button is clicked', async () => {
      const user = userEvent.setup();
      mockPlaidService.getBankAccountInfo.mockResolvedValue(mockBankInfo);
      
      render(<BankConnection {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('🗑️ Remove Bank Account')).toBeInTheDocument();
      });
      
      const removeButton = screen.getByText('🗑️ Remove Bank Account');
      await user.click(removeButton);
      
      await waitFor(() => {
        expect(mockPlaidService.removeBankAccount).toHaveBeenCalledWith('test-campaign-123');
      });
    });

    it('updates form data after successful removal', async () => {
      const user = userEvent.setup();
      mockPlaidService.getBankAccountInfo.mockResolvedValue(mockBankInfo);
      
      render(<BankConnection {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('🗑️ Remove Bank Account')).toBeInTheDocument();
      });
      
      vi.clearAllMocks(); // Clear initial updateFormData call
      
      const removeButton = screen.getByText('🗑️ Remove Bank Account');
      await user.click(removeButton);
      
      await waitFor(() => {
        expect(defaultProps.updateFormData).toHaveBeenCalledWith({
          bankAccountVerified: false,
          bankAccountInfo: null
        });
      });
      
      expect(screen.getByText(/Bank account disconnected successfully/)).toBeInTheDocument();
    });

    it('handles removal errors', async () => {
      const user = userEvent.setup();
      mockPlaidService.getBankAccountInfo.mockResolvedValue(mockBankInfo);
      mockPlaidService.removeBankAccount.mockRejectedValue(new Error('Removal failed'));
      
      render(<BankConnection {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('🗑️ Remove Bank Account')).toBeInTheDocument();
      });
      
      const removeButton = screen.getByText('🗑️ Remove Bank Account');
      await user.click(removeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to remove bank account: Removal failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('calls onPrev when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<BankConnection {...defaultProps} />);
      
      const backButton = screen.getByText('← Back');
      await user.click(backButton);
      
      expect(defaultProps.onPrev).toHaveBeenCalled();
    });

    it('allows next when bank account is verified', async () => {
      const user = userEvent.setup();
      mockPlaidService.getBankAccountInfo.mockResolvedValue(mockBankInfo);
      
      render(<BankConnection {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Next: Terms & Launch →')).not.toBeDisabled();
      });
      
      const nextButton = screen.getByText('Next: Terms & Launch →');
      await user.click(nextButton);
      
      expect(defaultProps.onNext).toHaveBeenCalled();
    });

    it('prevents next when bank account is not verified and not skipped', async () => {
      const user = userEvent.setup();
      render(<BankConnection {...defaultProps} />);
      
      const nextButton = screen.getByText('Next: Terms & Launch →');
      expect(nextButton).toBeDisabled();
      
      await user.click(nextButton);
      expect(screen.getByText(/Please connect a bank account or choose to skip/)).toBeInTheDocument();
    });

    it('allows next when bank connection is skipped for development', async () => {
      const user = userEvent.setup();
      render(<BankConnection {...defaultProps} />);
      
      const skipButton = screen.getByText('⚠️ Skip Bank Connection (Dev Only)');
      await user.click(skipButton);
      
      await waitFor(() => {
        expect(defaultProps.updateFormData).toHaveBeenCalledWith({
          skipBankConnection: true,
          bankAccountVerified: false
        });
      });
      
      expect(screen.getByText(/Bank connection skipped for development purposes/)).toBeInTheDocument();
      
      // Should automatically proceed after timeout
      await waitFor(() => {
        expect(defaultProps.onNext).toHaveBeenCalled();
      }, { timeout: 1500 });
    });
  });

  describe('Error Handling', () => {
    it('shows error when no campaign ID provided', async () => {
      const user = userEvent.setup();
      const propsWithoutCampaignId = { ...defaultProps, campaignId: null };
      
      render(<BankConnection {...propsWithoutCampaignId} />);
      
      await waitFor(() => {
        expect(screen.getByText('🔗 Connect Bank Account')).not.toBeDisabled();
      });
      
      const connectButton = screen.getByText('🔗 Connect Bank Account');
      await user.click(connectButton);
      
      expect(screen.getByText(/Campaign ID is required/)).toBeInTheDocument();
    });

    it('shows error when Plaid SDK is not ready', async () => {
      const user = userEvent.setup();
      global.window.Plaid = undefined;
      
      render(<BankConnection {...defaultProps} />);
      
      const connectButton = screen.getByText('⏳ Loading...');
      await user.click(connectButton);
      
      expect(screen.getByText(/Plaid SDK is not ready/)).toBeInTheDocument();
    });

    it('handles bank info loading errors gracefully', () => {
      mockPlaidService.getBankAccountInfo.mockRejectedValue(new Error('Load failed'));
      
      render(<BankConnection {...defaultProps} />);
      
      // Should not crash the component
      expect(screen.getByText('No Bank Account Connected')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith('Failed to load bank info:', expect.any(Error));
    });

    it('handles Plaid script loading errors', async () => {
      mockPlaidService.constructor.loadPlaidScript.mockRejectedValue(new Error('Script load failed'));
      
      render(<BankConnection {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load Plaid SDK/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<BankConnection {...defaultProps} />);
      
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent(/Connect Bank Account - Step 3/);
    });

    it('has accessible buttons with proper text', () => {
      render(<BankConnection {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /Back/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next: Terms & Launch/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Skip Bank Connection/ })).toBeInTheDocument();
    });

    it('maintains button states for accessibility', async () => {
      render(<BankConnection {...defaultProps} />);
      
      const nextButton = screen.getByRole('button', { name: /Next: Terms & Launch/ });
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveAttribute('disabled');
    });
  });

  describe('Component Snapshots', () => {
    it('matches snapshot for initial state', () => {
      const { container } = render(<BankConnection {...defaultProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for connected state', async () => {
      mockPlaidService.getBankAccountInfo.mockResolvedValue(mockBankInfo);
      
      render(<BankConnection {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('✅ Bank Account Connected')).toBeInTheDocument();
      });
      
      const { container } = render(<BankConnection {...defaultProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for error state', async () => {
      render(<BankConnection {...defaultProps} />);
      
      // Trigger error state
      const user = userEvent.setup();
      const connectButton = screen.getByText('⏳ Loading...');
      await user.click(connectButton);
      
      const { container } = render(<BankConnection {...defaultProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});