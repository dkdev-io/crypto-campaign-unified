import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '../../utils/test-utils';
import Web3Wallet from '../Web3Wallet';
import web3Service, { configureWeb3Mock } from '../../__mocks__/web3Service';

// Mock the web3 service
vi.mock('../lib/web3', () => ({ default: web3Service }));

describe('Web3Wallet', () => {
  const defaultProps = {
    onWalletChange: vi.fn(),
    showBalance: true,
  };

  beforeEach(() => {
    configureWeb3Mock.reset();
    vi.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('initializes web3 service on mount', () => {
      render(<Web3Wallet {...defaultProps} />);

      expect(web3Service.init).toHaveBeenCalled();
      expect(web3Service.setupEventListeners).toHaveBeenCalled();
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(<Web3Wallet {...defaultProps} />);

      unmount();

      expect(web3Service.removeEventListeners).toHaveBeenCalled();
    });

    it('calls onWalletChange callback when wallet state changes', async () => {
      const onWalletChange = vi.fn();
      render(<Web3Wallet onWalletChange={onWalletChange} />);

      // Should be called on initial render
      expect(onWalletChange).toHaveBeenCalledWith({
        isConnected: false,
        account: '',
        balance: '0',
        network: null,
        contributorInfo: null,
      });
    });
  });

  describe('MetaMask Not Found State', () => {
    beforeEach(() => {
      configureWeb3Mock.setMetaMaskAvailable(false);
    });

    it('shows MetaMask installation prompt when not available', async () => {
      render(<Web3Wallet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('🦊 MetaMask Required')).toBeInTheDocument();
      });

      expect(
        screen.getByText('To make crypto contributions, you need MetaMask wallet installed.')
      ).toBeInTheDocument();
      expect(screen.getByText('📥 Install MetaMask →')).toBeInTheDocument();
    });

    it('provides installation link', async () => {
      render(<Web3Wallet {...defaultProps} />);

      await waitFor(() => {
        const installLink = screen.getByText('📥 Install MetaMask →');
        expect(installLink).toHaveAttribute('href', 'https://metamask.io/');
        expect(installLink).toHaveAttribute('target', '_blank');
      });
    });
  });

  describe('Wallet Not Connected State', () => {
    beforeEach(() => {
      configureWeb3Mock.setMetaMaskAvailable(true);
      configureWeb3Mock.setConnected(false);
    });

    it('shows connect button when not connected', async () => {
      render(<Web3Wallet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('🦊 Connect MetaMask Wallet')).toBeInTheDocument();
      });
    });

    it('handles connection attempt', async () => {
      const user = userEvent.setup();
      render(<Web3Wallet {...defaultProps} />);

      await waitFor(() => {
        const connectButton = screen.getByText('🦊 Connect MetaMask Wallet');
        expect(connectButton).toBeInTheDocument();
      });

      const connectButton = screen.getByText('🦊 Connect MetaMask Wallet');
      await user.click(connectButton);

      expect(web3Service.connectWallet).toHaveBeenCalled();
    });

    it('shows loading state during connection', async () => {
      const user = userEvent.setup();

      // Make connectWallet hang
      web3Service.connectWallet.mockImplementation(() => new Promise(() => {}));

      render(<Web3Wallet {...defaultProps} />);

      const connectButton = await screen.findByText('🦊 Connect MetaMask Wallet');
      await user.click(connectButton);

      expect(screen.getByText('⏳ Connecting...')).toBeInTheDocument();
      expect(connectButton).toBeDisabled();
    });

    it('displays connection errors', async () => {
      const user = userEvent.setup();
      configureWeb3Mock.setConnected(false);
      web3Service.connectWallet.mockRejectedValue(new Error('User rejected connection'));

      render(<Web3Wallet {...defaultProps} />);

      const connectButton = await screen.findByText('🦊 Connect MetaMask Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('⚠️ User rejected connection')).toBeInTheDocument();
      });
    });
  });

  describe('Wallet Connected State', () => {
    beforeEach(() => {
      configureWeb3Mock.setMetaMaskAvailable(true);
      configureWeb3Mock.setConnected(true);
    });

    it('shows connected wallet information', async () => {
      render(<Web3Wallet {...defaultProps} />);

      // Simulate successful connection
      await waitFor(() => {
        const connectButton = screen.getByText('🦊 Connect MetaMask Wallet');
        expect(connectButton).toBeInTheDocument();
      });

      // Trigger connection success
      web3Service._triggerAccountChange('0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7');

      await waitFor(() => {
        expect(screen.getByText('🦊 Wallet Connected')).toBeInTheDocument();
        expect(screen.getByText('Address: 0x742d...D8e7')).toBeInTheDocument();
      });
    });

    it('displays wallet balance when showBalance is true', async () => {
      render(<Web3Wallet {...defaultProps} showBalance={true} />);

      web3Service._triggerAccountChange('0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7');

      await waitFor(() => {
        expect(screen.getByText('Balance: 1.5678 ETH')).toBeInTheDocument();
      });
    });

    it('hides balance when showBalance is false', async () => {
      render(<Web3Wallet {...defaultProps} showBalance={false} />);

      web3Service._triggerAccountChange('0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7');

      await waitFor(() => {
        expect(screen.getByText('🦊 Wallet Connected')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Balance:/)).not.toBeInTheDocument();
    });

    it('displays network information', async () => {
      render(<Web3Wallet {...defaultProps} />);

      web3Service._triggerAccountChange('0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7');

      await waitFor(() => {
        expect(screen.getByText('Network: Ethereum Mainnet (0x1)')).toBeInTheDocument();
      });
    });

    it('shows disconnect button', async () => {
      render(<Web3Wallet {...defaultProps} />);

      web3Service._triggerAccountChange('0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7');

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });
    });

    it('handles disconnection', async () => {
      const user = userEvent.setup();
      render(<Web3Wallet {...defaultProps} />);

      web3Service._triggerAccountChange('0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7');

      await waitFor(() => {
        const disconnectButton = screen.getByText('Disconnect');
        expect(disconnectButton).toBeInTheDocument();
      });

      const disconnectButton = screen.getByText('Disconnect');
      await user.click(disconnectButton);

      expect(web3Service.disconnectWallet).toHaveBeenCalled();
    });
  });

  describe('Contributor Information', () => {
    beforeEach(() => {
      configureWeb3Mock.setMetaMaskAvailable(true);
      configureWeb3Mock.setConnected(true);
    });

    it('displays KYC verification status', async () => {
      configureWeb3Mock.setKYCStatus(true);
      render(<Web3Wallet {...defaultProps} />);

      web3Service._triggerAccountChange('0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7');

      await waitFor(() => {
        expect(screen.getByText('KYC Status: ✅ Verified')).toBeInTheDocument();
      });
    });

    it('shows unverified KYC status', async () => {
      configureWeb3Mock.setKYCStatus(false);
      render(<Web3Wallet {...defaultProps} />);

      web3Service._triggerAccountChange('0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7');

      await waitFor(() => {
        expect(screen.getByText('KYC Status: ❌ Not Verified')).toBeInTheDocument();
      });
    });

    it('displays contribution history', async () => {
      render(<Web3Wallet {...defaultProps} />);

      web3Service._triggerAccountChange('0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7');

      await waitFor(() => {
        expect(screen.getByText('Previous Contributions: 0.5 ETH')).toBeInTheDocument();
        expect(screen.getByText('Remaining Capacity: 1 ETH')).toBeInTheDocument();
      });
    });

    it('handles missing contributor info gracefully', async () => {
      web3Service.getContributorInfo.mockRejectedValue(new Error('Contract not deployed'));
      render(<Web3Wallet {...defaultProps} />);

      web3Service._triggerAccountChange('0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7');

      await waitFor(() => {
        expect(screen.getByText('🦊 Wallet Connected')).toBeInTheDocument();
      });

      // Should not show contributor info section
      expect(screen.queryByText(/KYC Status:/)).not.toBeInTheDocument();
    });
  });

  describe('Balance Formatting', () => {
    beforeEach(() => {
      configureWeb3Mock.setMetaMaskAvailable(true);
      configureWeb3Mock.setConnected(true);
    });

    it('formats zero balance correctly', async () => {
      web3Service.getBalance.mockResolvedValue('0');
      render(<Web3Wallet {...defaultProps} />);

      web3Service._triggerAccountChange('0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7');

      await waitFor(() => {
        expect(screen.getByText('Balance: 0 ETH')).toBeInTheDocument();
      });
    });

    it('formats small balances correctly', async () => {
      web3Service.getBalance.mockResolvedValue('0.000123');
      render(<Web3Wallet {...defaultProps} />);

      web3Service._triggerAccountChange('0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7');

      await waitFor(() => {
        expect(screen.getByText('Balance: < 0.001 ETH')).toBeInTheDocument();
      });
    });

    it('formats regular balances to 4 decimal places', async () => {
      web3Service.getBalance.mockResolvedValue('1.123456789');
      render(<Web3Wallet {...defaultProps} />);

      web3Service._triggerAccountChange('0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7');

      await waitFor(() => {
        expect(screen.getByText('Balance: 1.1235 ETH')).toBeInTheDocument();
      });
    });
  });

  describe('Address Formatting', () => {
    beforeEach(() => {
      configureWeb3Mock.setMetaMaskAvailable(true);
      configureWeb3Mock.setConnected(true);
    });

    it('formats addresses correctly', async () => {
      render(<Web3Wallet {...defaultProps} />);

      web3Service._triggerAccountChange('0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7');

      await waitFor(() => {
        expect(screen.getByText('Address: 0x742d...D8e7')).toBeInTheDocument();
      });
    });

    it('handles empty address', async () => {
      render(<Web3Wallet {...defaultProps} />);

      web3Service._triggerAccountChange('');

      await waitFor(() => {
        expect(screen.getByText('🦊 Connect MetaMask Wallet')).toBeInTheDocument();
      });
    });
  });

  describe('Event Listeners', () => {
    beforeEach(() => {
      configureWeb3Mock.setMetaMaskAvailable(true);
    });

    it('handles account change events', async () => {
      const onWalletChange = vi.fn();
      render(<Web3Wallet onWalletChange={onWalletChange} />);

      // Trigger account change
      web3Service._triggerAccountChange('0x123...');

      await waitFor(() => {
        expect(onWalletChange).toHaveBeenCalledWith(
          expect.objectContaining({
            isConnected: false, // Initial state
            account: '0x123...',
          })
        );
      });
    });

    it('handles account disconnection', async () => {
      const onWalletChange = vi.fn();
      render(<Web3Wallet onWalletChange={onWalletChange} />);

      // First connect
      web3Service._triggerAccountChange('0x123...');

      // Then disconnect
      web3Service._triggerAccountChange(null);

      await waitFor(() => {
        expect(screen.getByText('🦊 Connect MetaMask Wallet')).toBeInTheDocument();
      });
    });

    it('handles network change events', async () => {
      render(<Web3Wallet {...defaultProps} />);

      // First connect
      web3Service._triggerAccountChange('0x123...');

      // Then change network
      web3Service._triggerNetworkChange('0x4'); // Rinkeby

      expect(web3Service.loadNetworkInfo).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles initialization errors gracefully', async () => {
      web3Service.init.mockRejectedValue(new Error('Initialization failed'));
      render(<Web3Wallet {...defaultProps} />);

      // Should not crash and should show some fallback
      expect(screen.getByText('🦊 Connect MetaMask Wallet')).toBeInTheDocument();
    });

    it('handles balance loading errors', async () => {
      web3Service.getBalance.mockRejectedValue(new Error('Failed to get balance'));
      render(<Web3Wallet {...defaultProps} />);

      web3Service._triggerAccountChange('0x123...');

      // Should still show connected state without balance
      await waitFor(() => {
        expect(screen.getByText('🦊 Wallet Connected')).toBeInTheDocument();
      });
    });

    it('handles network loading errors', async () => {
      web3Service.getNetworkInfo.mockRejectedValue(new Error('Failed to get network'));
      render(<Web3Wallet {...defaultProps} />);

      web3Service._triggerAccountChange('0x123...');

      // Should still show connected state without network info
      await waitFor(() => {
        expect(screen.getByText('🦊 Wallet Connected')).toBeInTheDocument();
      });
    });
  });

  describe('Component Props', () => {
    it('works without onWalletChange callback', () => {
      expect(() => {
        render(<Web3Wallet showBalance={true} />);
      }).not.toThrow();
    });

    it('uses default showBalance value', () => {
      render(<Web3Wallet onWalletChange={vi.fn()} />);

      web3Service._triggerAccountChange('0x123...');

      // Should show balance by default
      expect(screen.getByText(/Balance:/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      configureWeb3Mock.setMetaMaskAvailable(true);
    });

    it('has proper button roles and labels', async () => {
      render(<Web3Wallet {...defaultProps} />);

      const connectButton = await screen.findByRole('button', { name: /Connect MetaMask Wallet/ });
      expect(connectButton).toBeInTheDocument();
    });

    it('has proper link attributes for external links', async () => {
      configureWeb3Mock.setMetaMaskAvailable(false);
      render(<Web3Wallet {...defaultProps} />);

      await waitFor(() => {
        const installLink = screen.getByRole('link', { name: /Install MetaMask/ });
        expect(installLink).toHaveAttribute('rel', 'noopener noreferrer');
        expect(installLink).toHaveAttribute('target', '_blank');
      });
    });

    it('maintains proper focus management', async () => {
      const user = userEvent.setup();
      render(<Web3Wallet {...defaultProps} />);

      const connectButton = await screen.findByRole('button');
      connectButton.focus();

      expect(connectButton).toHaveFocus();
    });

    it('has appropriate ARIA attributes for disabled states', async () => {
      const user = userEvent.setup();

      // Make connection hang to test disabled state
      web3Service.connectWallet.mockImplementation(() => new Promise(() => {}));

      render(<Web3Wallet {...defaultProps} />);

      const connectButton = await screen.findByRole('button');
      await user.click(connectButton);

      expect(connectButton).toBeDisabled();
      expect(connectButton).toHaveAttribute('aria-disabled', 'true');
    });
  });
});
