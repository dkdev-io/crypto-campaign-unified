import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '../../../utils/test-utils';
import Signup from '../Signup';

describe('Signup', () => {
  const defaultProps = {
    formData: {},
    updateFormData: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders signup step with title and description', () => {
      render(<Signup {...defaultProps} />);
      
      expect(screen.getByText(/Campaign Setup - Step 1/)).toBeInTheDocument();
      expect(screen.getByText(/Tell us about yourself and your campaign/)).toBeInTheDocument();
    });

    it('renders all required form fields', () => {
      render(<Signup {...defaultProps} />);
      
      expect(screen.getByLabelText(/Your Full Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Your Email Address/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Campaign Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Committee Name or Search Term/)).toBeInTheDocument();
    });

    it('renders optional fields', () => {
      render(<Signup {...defaultProps} />);
      
      expect(screen.getByLabelText(/Suggested Contribution Amounts/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Maximum Contribution Limit/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Campaign Website/)).toBeInTheDocument();
    });

    it('renders next button with correct text', () => {
      render(<Signup {...defaultProps} />);
      
      expect(screen.getByText('Next: Find Your Committee →')).toBeInTheDocument();
    });

    it('does not render back button on first step', () => {
      render(<Signup {...defaultProps} />);
      
      expect(screen.queryByText(/Back/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Previous/)).not.toBeInTheDocument();
    });
  });

  describe('Form Data Population', () => {
    it('displays existing data from formData props', () => {
      const propsWithData = {
        ...defaultProps,
        formData: {
          userFullName: 'John Doe',
          campaignName: 'Doe for Mayor',
          email: 'john@doe2024.com',
          website: 'https://doe2024.com'
        }
      };

      render(<Signup {...propsWithData} />);
      
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe for Mayor')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@doe2024.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://doe2024.com')).toBeInTheDocument();
    });

    it('shows empty fields when no form data provided', () => {
      render(<Signup {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/Your Full Name/);
      const campaignInput = screen.getByLabelText(/Campaign Name/);
      const emailInput = screen.getByLabelText(/Email Address/);
      const websiteInput = screen.getByLabelText(/Campaign Website/);
      
      expect(nameInput.value).toBe('');
      expect(campaignInput.value).toBe('');
      expect(emailInput.value).toBe('');
      expect(websiteInput.value).toBe('');
    });
  });

  describe('User Input Handling', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('updates form data when full name is changed', async () => {
      render(<Signup {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/Your Full Name/);
      await user.type(nameInput, 'Jane Smith');
      
      // Check that updateFormData was called with the final character
      expect(defaultProps.updateFormData).toHaveBeenLastCalledWith({
        userFullName: 'h'
      });
      // Check that it was called the correct number of times
      expect(defaultProps.updateFormData).toHaveBeenCalledTimes(10);
    });

    it('updates form data when campaign name is changed', async () => {
      render(<Signup {...defaultProps} />);
      
      const campaignInput = screen.getByLabelText(/Campaign Name/);
      await user.type(campaignInput, 'Smith for Senate');
      
      // Check that updateFormData was called with the final character
      expect(defaultProps.updateFormData).toHaveBeenLastCalledWith({
        campaignName: 'e'
      });
      // Check that it was called the correct number of times (16 characters)
      expect(defaultProps.updateFormData).toHaveBeenCalledTimes(16);
    });

    it('updates form data when email is changed', async () => {
      render(<Signup {...defaultProps} />);
      
      const emailInput = screen.getByLabelText(/Email Address/);
      await user.type(emailInput, 'jane@smith2024.com');
      
      // Check that updateFormData was called with the final character
      expect(defaultProps.updateFormData).toHaveBeenLastCalledWith({
        email: 'm'
      });
      // Check that it was called the correct number of times (18 characters)
      expect(defaultProps.updateFormData).toHaveBeenCalledTimes(18);
    });

    it('updates form data when website is changed', async () => {
      render(<Signup {...defaultProps} />);
      
      const websiteInput = screen.getByLabelText(/Campaign Website/);
      await user.type(websiteInput, 'https://smith2024.com');
      
      // Check that updateFormData was called with the final character
      expect(defaultProps.updateFormData).toHaveBeenLastCalledWith({
        website: 'm'
      });
      // Check that it was called the correct number of times (21 characters)
      expect(defaultProps.updateFormData).toHaveBeenCalledTimes(21);
    });

    it('calls updateFormData for each character typed', async () => {
      render(<Signup {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/Your Full Name/);
      await user.type(nameInput, 'Test');
      
      // Should be called 4 times, once for each character
      expect(defaultProps.updateFormData).toHaveBeenCalledTimes(4);
      expect(defaultProps.updateFormData).toHaveBeenNthCalledWith(1, { userFullName: 'T' });
      expect(defaultProps.updateFormData).toHaveBeenNthCalledWith(4, { userFullName: 't' });
    });
  });

  describe('Navigation', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('calls onNext when next button is clicked with valid form', async () => {
      const propsWithValidData = {
        ...defaultProps,
        formData: {
          userFullName: 'John Doe',
          email: 'john@test.com',
          campaignName: 'Test Campaign',
          committeeNameSearch: 'Test Committee'
        }
      };
      render(<Signup {...propsWithValidData} />);
      
      const nextButton = screen.getByText('Next: Find Your Committee →');
      await user.click(nextButton);
      
      expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
    });

    it('prevents navigation with empty required fields', async () => {
      render(<Signup {...defaultProps} />);
      
      // Should NOT be able to proceed with empty required fields
      const nextButton = screen.getByText('Next: Find Your Committee →');
      await user.click(nextButton);
      
      expect(defaultProps.onNext).not.toHaveBeenCalled();
    });

    it('shows validation errors for empty required fields', async () => {
      render(<Signup {...defaultProps} />);
      
      const nextButton = screen.getByText('Next: Find Your Committee →');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Your full name is required')).toBeInTheDocument();
        expect(screen.getByText('Email address is required')).toBeInTheDocument();
        expect(screen.getByText('Campaign name is required')).toBeInTheDocument();
        expect(screen.getByText('Committee name is required')).toBeInTheDocument();
      });
    });
  });

  describe('Form Field Validation', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('email field has email input type', () => {
      render(<Signup {...defaultProps} />);
      
      const emailInput = screen.getByLabelText(/Email Address/);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('website field has url input type', () => {
      render(<Signup {...defaultProps} />);
      
      const websiteInput = screen.getByLabelText(/Campaign Website/);
      expect(websiteInput).toHaveAttribute('type', 'url');
    });

    it('required fields have required attribute', () => {
      render(<Signup {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/Your Full Name/);
      const campaignInput = screen.getByLabelText(/Campaign Name/);
      const emailInput = screen.getByLabelText(/Email Address/);
      const committeeInput = screen.getByLabelText(/Committee Name or Search Term/);
      const websiteInput = screen.getByLabelText(/Campaign Website/);
      
      expect(nameInput).toBeRequired();
      expect(campaignInput).toBeRequired();
      expect(emailInput).toBeRequired();
      expect(committeeInput).toBeRequired();
      expect(websiteInput).toBeRequired();
    });

    it('shows placeholder text for guidance', () => {
      render(<Signup {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., Smith for Mayor 2024')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your.email@domain.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://yourcampaign.com')).toBeInTheDocument();
    });
  });

  describe('Information Sections', () => {
    it('displays what happens next section', () => {
      render(<Signup {...defaultProps} />);
      
      expect(screen.getByText('🔄 What Happens Next')).toBeInTheDocument();
      expect(screen.getByText(/Find Your FEC Committee/)).toBeInTheDocument();
      expect(screen.getByText(/Connect Bank Account/)).toBeInTheDocument();
      expect(screen.getByText(/Launch Your Form/)).toBeInTheDocument();
    });

    it('displays privacy and security information', () => {
      render(<Signup {...defaultProps} />);
      
      expect(screen.getByText('🔒 Privacy & Security')).toBeInTheDocument();
      expect(screen.getByText(/Your information is encrypted/)).toBeInTheDocument();
      expect(screen.getByText(/FEC-compliant data handling/)).toBeInTheDocument();
      expect(screen.getByText(/You control your campaign data/)).toBeInTheDocument();
    });

    it('displays requirements information', () => {
      render(<Signup {...defaultProps} />);
      
      expect(screen.getByText('📋 Requirements')).toBeInTheDocument();
      expect(screen.getByText(/Valid FEC committee/)).toBeInTheDocument();
      expect(screen.getByText(/Campaign bank account/)).toBeInTheDocument();
      expect(screen.getByText(/Official campaign website/)).toBeInTheDocument();
    });
  });

  describe('CSS Styling', () => {
    it('applies correct CSS classes to form elements', () => {
      render(<Signup {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/Your Full Name/);
      const emailInput = screen.getByLabelText(/Email Address/);
      
      expect(nameInput).toHaveClass('form-input');
      expect(emailInput).toHaveClass('form-input');
    });

    it('applies correct styling to containers and sections', () => {
      const { container } = render(<Signup {...defaultProps} />);
      
      expect(container.querySelector('.form-group')).toBeInTheDocument();
      expect(container.querySelector('.form-actions')).toBeInTheDocument();
    });

    it('styles next button with primary class', () => {
      render(<Signup {...defaultProps} />);
      
      const nextButton = screen.getByText('Next: Find Your Committee →');
      expect(nextButton).toHaveClass('btn', 'btn-primary');
    });
  });

  describe('Help Text and Instructions', () => {
    it('displays help text for each field', () => {
      render(<Signup {...defaultProps} />);
      
      expect(screen.getByText(/This will be used for FEC reporting/)).toBeInTheDocument();
      expect(screen.getByText(/Publicly displayed name for your campaign/)).toBeInTheDocument();
      expect(screen.getByText(/Used for notifications and account management/)).toBeInTheDocument();
      expect(screen.getByText(/Your official campaign website/)).toBeInTheDocument();
    });

    it('provides clear instructions for getting started', () => {
      render(<Signup {...defaultProps} />);
      
      expect(screen.getByText(/We'll guide you through the complete setup/)).toBeInTheDocument();
      expect(screen.getByText(/This process takes about 5-10 minutes/)).toBeInTheDocument();
    });
  });

  describe('Special Character Handling', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('handles special characters in name field', async () => {
      const propsWithData = {
        ...defaultProps,
        formData: { userFullName: 'José María O\'Connor-Smith' }
      };
      render(<Signup {...propsWithData} />);
      
      const nameInput = screen.getByLabelText(/Your Full Name/);
      expect(nameInput.value).toBe('José María O\'Connor-Smith');
    });

    it('handles campaign names with special characters', async () => {
      const propsWithData = {
        ...defaultProps,
        formData: { campaignName: 'Citizens for Change & Progress 2024!' }
      };
      render(<Signup {...propsWithData} />);
      
      const campaignInput = screen.getByLabelText(/Campaign Name/);
      expect(campaignInput.value).toBe('Citizens for Change & Progress 2024!');
    });

    it('handles international domain names in website field', async () => {
      const propsWithData = {
        ...defaultProps,
        formData: { website: 'https://campaña2024.com' }
      };
      render(<Signup {...propsWithData} />);
      
      const websiteInput = screen.getByLabelText(/Campaign Website/);
      expect(websiteInput.value).toBe('https://campaña2024.com');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<Signup {...defaultProps} />);
      
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent(/Campaign Setup - Step 1/);
    });

    it('has proper form labels associated with inputs', () => {
      render(<Signup {...defaultProps} />);
      
      expect(screen.getByLabelText(/Your Full Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Campaign Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Campaign Website/)).toBeInTheDocument();
    });

    it('has accessible button with descriptive text', () => {
      render(<Signup {...defaultProps} />);
      
      const nextButton = screen.getByRole('button', { name: /Next: Find Your Committee/ });
      expect(nextButton).toBeInTheDocument();
    });

    it('maintains focus when typing in inputs', async () => {
      const user = userEvent.setup();
      render(<Signup {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/Your Full Name/);
      await user.click(nameInput);
      await user.type(nameInput, 'Test Name');
      
      expect(nameInput).toHaveFocus();
    });

    it('has proper ARIA attributes for required fields', () => {
      render(<Signup {...defaultProps} />);
      
      const requiredInputs = [
        screen.getByLabelText(/Your Full Name/),
        screen.getByLabelText(/Campaign Name/),
        screen.getByLabelText(/Email Address/),
        screen.getByLabelText(/Committee Name or Search Term/),
        screen.getByLabelText(/Campaign Website/)
      ];
      
      requiredInputs.forEach(input => {
        expect(input).toHaveAttribute('aria-required', 'true');
      });
    });
  });

  describe('Component Snapshots', () => {
    it('matches snapshot for empty form', () => {
      const { container } = render(<Signup {...defaultProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for populated form', () => {
      const propsWithData = {
        ...defaultProps,
        formData: {
          userFullName: 'Jane Doe',
          campaignName: 'Doe for Governor 2024',
          email: 'jane@doe2024.org',
          website: 'https://jane-doe-2024.org'
        }
      };

      const { container } = render(<Signup {...propsWithData} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});