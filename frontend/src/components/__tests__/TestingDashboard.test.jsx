import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '../../utils/test-utils';
import TestingDashboard from '../TestingDashboard';
import { processContribution } from '../../lib/smart-contract';

// Mock the smart-contract module
vi.mock('../../lib/smart-contract', () => ({
  processContribution: vi.fn(),
}));

describe('TestingDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    processContribution.mockResolvedValue({
      success: true,
      transactionHash: '0xabc123...',
      blockNumber: 18500000,
      gasUsed: '21000',
    });
  });

  describe('Component Rendering', () => {
    it('renders testing dashboard with correct title and description', () => {
      render(<TestingDashboard />);

      expect(screen.getByText('🧪 Smart Contract Testing Dashboard')).toBeInTheDocument();
      expect(
        screen.getByText(/Test contribution limits without triggering wallet extensions/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Testing Mode Active/)).toBeInTheDocument();
    });

    it('displays smart contract requirements', () => {
      render(<TestingDashboard />);

      expect(screen.getByText('Smart Contract Requirements:')).toBeInTheDocument();
      expect(screen.getByText(/FEC Individual Limit.*\$3,300 per election/)).toBeInTheDocument();
      expect(screen.getByText(/Minimum.*\$1/)).toBeInTheDocument();
      expect(screen.getByText(/Complete Info.*All fields required/)).toBeInTheDocument();
      expect(screen.getByText(/Compliance.*FEC acknowledgment checkbox/)).toBeInTheDocument();
    });

    it('renders all form fields correctly', () => {
      render(<TestingDashboard />);

      expect(screen.getByLabelText(/Contribution Amount/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Wallet Address/)).toBeInTheDocument();
      expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('shows test button and empty results section', () => {
      render(<TestingDashboard />);

      expect(screen.getByText('🧪 Test Smart Contract Limits')).toBeInTheDocument();
      expect(screen.getByText(/No tests run yet/)).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup();
      render(<TestingDashboard />);
    });

    it('allows user to input contribution amount', async () => {
      const amountInput = screen.getByLabelText(/Contribution Amount/);
      await user.type(amountInput, '100');

      expect(amountInput.value).toBe('100');
    });

    it('allows user to input wallet address', async () => {
      const walletInput = screen.getByLabelText(/Wallet Address/);
      await user.type(walletInput, '0x742d35cc6e4c43b3b5132b6c7e5c85b4a6b8b6a8');

      expect(walletInput.value).toBe('0x742d35cc6e4c43b3b5132b6c7e5c85b4a6b8b6a8');
    });

    it('allows user to input name fields', async () => {
      const firstNameInput = screen.getByLabelText(/First Name/);
      const lastNameInput = screen.getByLabelText(/Last Name/);

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');

      expect(firstNameInput.value).toBe('John');
      expect(lastNameInput.value).toBe('Doe');
    });

    it('allows user to input email', async () => {
      const emailInput = screen.getByLabelText(/Email/);
      await user.type(emailInput, 'john@example.com');

      expect(emailInput.value).toBe('john@example.com');
    });

    it('allows user to toggle acknowledgment checkbox', async () => {
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Form Validation', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup();
      render(<TestingDashboard />);
    });

    it('shows alert when required fields are missing', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const testButton = screen.getByText('🧪 Test Smart Contract Limits');
      await user.click(testButton);

      expect(alertSpy).toHaveBeenCalledWith('Please fill in all required fields');
      alertSpy.mockRestore();
    });

    it('does not run test when fields are incomplete', async () => {
      const testButton = screen.getByText('🧪 Test Smart Contract Limits');

      // Only fill some fields
      await user.type(screen.getByLabelText(/Contribution Amount/), '100');
      await user.type(screen.getByLabelText(/First Name/), 'John');

      await user.click(testButton);

      expect(processContribution).not.toHaveBeenCalled();
    });
  });

  describe('Smart Contract Testing', () => {
    let user;
    const fillAllFields = async (user) => {
      await user.type(screen.getByLabelText(/Contribution Amount/), '100');
      await user.type(
        screen.getByLabelText(/Wallet Address/),
        '0x742d35cc6e4c43b3b5132b6c7e5c85b4a6b8b6a8'
      );
      await user.type(screen.getByLabelText(/First Name/), 'John');
      await user.type(screen.getByLabelText(/Last Name/), 'Doe');
      await user.type(screen.getByLabelText(/Email/), 'john@example.com');
      await user.click(screen.getByRole('checkbox'));
    };

    beforeEach(() => {
      user = userEvent.setup();
      render(<TestingDashboard />);
    });

    it('runs successful smart contract test', async () => {
      await fillAllFields(user);

      const testButton = screen.getByText('🧪 Test Smart Contract Limits');
      await user.click(testButton);

      // Check loading state
      expect(screen.getByText('⏳ Testing Smart Contract...')).toBeInTheDocument();

      // Wait for completion
      await waitFor(() => {
        expect(processContribution).toHaveBeenCalledWith(
          {
            amount: '100',
            walletAddress: '0x742d35cc6e4c43b3b5132b6c7e5c85b4a6b8b6a8',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            acknowledgmentSigned: true,
          },
          'test-campaign-123'
        );
      });

      // Check success result display
      await waitFor(() => {
        expect(screen.getByText('✅ SUCCESS')).toBeInTheDocument();
        expect(screen.getByText(/Amount Tested.*\$100/)).toBeInTheDocument();
        expect(screen.getByText(/Name.*John Doe/)).toBeInTheDocument();
        expect(screen.getByText(/Email.*john@example.com/)).toBeInTheDocument();
        expect(screen.getByText(/Transaction Hash.*0xabc123/)).toBeInTheDocument();
        expect(screen.getByText(/Block.*18500000/)).toBeInTheDocument();
        expect(screen.getByText(/Gas Used.*21000/)).toBeInTheDocument();
      });
    });

    it('handles smart contract test failure', async () => {
      processContribution.mockResolvedValue({
        success: false,
        error: 'Amount exceeds FEC limit',
      });

      await fillAllFields(user);

      const testButton = screen.getByText('🧪 Test Smart Contract Limits');
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByText('❌ FAILED')).toBeInTheDocument();
        expect(screen.getByText(/Error.*Amount exceeds FEC limit/)).toBeInTheDocument();
      });
    });

    it('handles smart contract test exception', async () => {
      processContribution.mockRejectedValue(new Error('Network connection failed'));

      await fillAllFields(user);

      const testButton = screen.getByText('🧪 Test Smart Contract Limits');
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByText('❌ FAILED')).toBeInTheDocument();
        expect(screen.getByText(/Error.*Network connection failed/)).toBeInTheDocument();
      });
    });

    it('updates button state during testing', async () => {
      processContribution.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      await fillAllFields(user);

      const testButton = screen.getByText('🧪 Test Smart Contract Limits');
      await user.click(testButton);

      // Check loading state
      expect(screen.getByText('⏳ Testing Smart Contract...')).toBeInTheDocument();
      expect(testButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('🧪 Test Smart Contract Limits')).toBeInTheDocument();
      });
      expect(testButton).not.toBeDisabled();
    });

    it('displays multiple test results in chronological order', async () => {
      // First test
      await fillAllFields(user);
      await user.click(screen.getByText('🧪 Test Smart Contract Limits'));

      await waitFor(() => {
        expect(screen.getByText('✅ SUCCESS')).toBeInTheDocument();
      });

      // Second test with different data
      await user.clear(screen.getByLabelText(/Contribution Amount/));
      await user.type(screen.getByLabelText(/Contribution Amount/), '250');

      processContribution.mockResolvedValue({
        success: false,
        error: 'Test error',
      });

      await user.click(screen.getByText('🧪 Test Smart Contract Limits'));

      await waitFor(() => {
        expect(screen.getAllByText(/SUCCESS|FAILED/)).toHaveLength(2);
        expect(screen.getByText('❌ FAILED')).toBeInTheDocument();
        expect(screen.getByText(/Amount Tested.*\$250/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and ARIA attributes', () => {
      render(<TestingDashboard />);

      const amountInput = screen.getByLabelText(/Contribution Amount/);
      const walletInput = screen.getByLabelText(/Wallet Address/);
      const firstNameInput = screen.getByLabelText(/First Name/);
      const lastNameInput = screen.getByLabelText(/Last Name/);
      const emailInput = screen.getByLabelText(/Email/);

      expect(amountInput).toBeInTheDocument();
      expect(walletInput).toBeInTheDocument();
      expect(firstNameInput).toBeInTheDocument();
      expect(lastNameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();

      // Check input types
      expect(amountInput).toHaveAttribute('type', 'number');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('has proper button roles and accessible text', () => {
      render(<TestingDashboard />);

      const testButton = screen.getByRole('button', { name: /Test Smart Contract Limits/ });
      expect(testButton).toBeInTheDocument();
    });

    it('maintains focus management', async () => {
      const user = userEvent.setup();
      render(<TestingDashboard />);

      const amountInput = screen.getByLabelText(/Contribution Amount/);
      amountInput.focus();

      await user.type(amountInput, '100');
      expect(amountInput).toHaveFocus();
    });
  });

  describe('Component Snapshots', () => {
    it('matches snapshot for initial state', () => {
      const { container } = render(<TestingDashboard />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with test results', async () => {
      const user = userEvent.setup();
      render(<TestingDashboard />);

      // Fill form and run test
      await user.type(screen.getByLabelText(/Contribution Amount/), '100');
      await user.type(
        screen.getByLabelText(/Wallet Address/),
        '0x742d35cc6e4c43b3b5132b6c7e5c85b4a6b8b6a8'
      );
      await user.type(screen.getByLabelText(/First Name/), 'John');
      await user.type(screen.getByLabelText(/Last Name/), 'Doe');
      await user.type(screen.getByLabelText(/Email/), 'john@example.com');
      await user.click(screen.getByRole('checkbox'));

      await user.click(screen.getByText('🧪 Test Smart Contract Limits'));

      await waitFor(() => {
        expect(screen.getByText('✅ SUCCESS')).toBeInTheDocument();
      });

      const { container } = render(<TestingDashboard />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
