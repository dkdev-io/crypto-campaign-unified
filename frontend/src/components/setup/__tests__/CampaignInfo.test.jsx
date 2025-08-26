import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '../../../utils/test-utils';
import CampaignInfo from '../CampaignInfo';

describe('CampaignInfo', () => {
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
    it('renders campaign information component with title', () => {
      render(<CampaignInfo {...defaultProps} />);
      
      expect(screen.getByText('Campaign Information')).toBeInTheDocument();
    });

    it('renders campaign name input field', () => {
      render(<CampaignInfo {...defaultProps} />);
      
      expect(screen.getByText('Campaign Name')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /Campaign Name/i })).toBeInTheDocument();
    });

    it('renders website input field', () => {
      render(<CampaignInfo {...defaultProps} />);
      
      expect(screen.getByText('Website')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /Website/i })).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
      render(<CampaignInfo {...defaultProps} />);
      
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });

  describe('Form Data Population', () => {
    it('displays existing campaign name from form data', () => {
      const propsWithData = {
        ...defaultProps,
        formData: {
          campaignName: 'Test Campaign 2024'
        }
      };

      render(<CampaignInfo {...propsWithData} />);
      
      const campaignNameInput = screen.getByRole('textbox', { name: /Campaign Name/i });
      expect(campaignNameInput.value).toBe('Test Campaign 2024');
    });

    it('displays existing website from form data', () => {
      const propsWithData = {
        ...defaultProps,
        formData: {
          website: 'https://campaign2024.com'
        }
      };

      render(<CampaignInfo {...propsWithData} />);
      
      const websiteInput = screen.getByRole('textbox', { name: /Website/i });
      expect(websiteInput.value).toBe('https://campaign2024.com');
    });

    it('shows empty fields when no form data provided', () => {
      render(<CampaignInfo {...defaultProps} />);
      
      const campaignNameInput = screen.getByRole('textbox', { name: /Campaign Name/i });
      const websiteInput = screen.getByRole('textbox', { name: /Website/i });
      
      expect(campaignNameInput.value).toBe('');
      expect(websiteInput.value).toBe('');
    });
  });

  describe('User Input Handling', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('updates form data when campaign name is changed', async () => {
      render(<CampaignInfo {...defaultProps} />);
      
      const campaignNameInput = screen.getByRole('textbox', { name: /Campaign Name/i });
      await user.type(campaignNameInput, 'New Campaign Name');
      
      expect(defaultProps.updateFormData).toHaveBeenCalledWith({
        campaignName: 'New Campaign Name'
      });
    });

    it('updates form data when website is changed', async () => {
      render(<CampaignInfo {...defaultProps} />);
      
      const websiteInput = screen.getByRole('textbox', { name: /Website/i });
      await user.type(websiteInput, 'https://newcampaign.com');
      
      expect(defaultProps.updateFormData).toHaveBeenCalledWith({
        website: 'https://newcampaign.com'
      });
    });

    it('calls updateFormData for each character typed', async () => {
      render(<CampaignInfo {...defaultProps} />);
      
      const campaignNameInput = screen.getByRole('textbox', { name: /Campaign Name/i });
      await user.type(campaignNameInput, 'Test');
      
      // Should be called for each character
      expect(defaultProps.updateFormData).toHaveBeenCalledTimes(4);
      expect(defaultProps.updateFormData).toHaveBeenNthCalledWith(1, { campaignName: 'T' });
      expect(defaultProps.updateFormData).toHaveBeenNthCalledWith(2, { campaignName: 'Te' });
      expect(defaultProps.updateFormData).toHaveBeenNthCalledWith(3, { campaignName: 'Tes' });
      expect(defaultProps.updateFormData).toHaveBeenNthCalledWith(4, { campaignName: 'Test' });
    });

    it('handles clearing input fields', async () => {
      const propsWithData = {
        ...defaultProps,
        formData: {
          campaignName: 'Original Name',
          website: 'https://original.com'
        }
      };

      render(<CampaignInfo {...propsWithData} />);
      
      const campaignNameInput = screen.getByRole('textbox', { name: /Campaign Name/i });
      await user.clear(campaignNameInput);
      
      expect(defaultProps.updateFormData).toHaveBeenCalledWith({
        campaignName: ''
      });
    });
  });

  describe('Navigation', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('calls onPrev when back button is clicked', async () => {
      render(<CampaignInfo {...defaultProps} />);
      
      const backButton = screen.getByText('Back');
      await user.click(backButton);
      
      expect(defaultProps.onPrev).toHaveBeenCalledTimes(1);
    });

    it('calls onNext when next button is clicked', async () => {
      render(<CampaignInfo {...defaultProps} />);
      
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
    });

    it('allows navigation without form validation', async () => {
      render(<CampaignInfo {...defaultProps} />);
      
      // Should be able to click next even with empty fields
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      
      expect(defaultProps.onNext).toHaveBeenCalled();
    });
  });

  describe('CSS Classes', () => {
    it('applies correct CSS classes to form elements', () => {
      render(<CampaignInfo {...defaultProps} />);
      
      const campaignNameInput = screen.getByRole('textbox', { name: /Campaign Name/i });
      const websiteInput = screen.getByRole('textbox', { name: /Website/i });
      
      expect(campaignNameInput).toHaveClass('form-input');
      expect(websiteInput).toHaveClass('form-input');
    });

    it('applies correct CSS classes to form groups and actions', () => {
      const { container } = render(<CampaignInfo {...defaultProps} />);
      
      expect(container.querySelector('.form-group')).toBeInTheDocument();
      expect(container.querySelector('.form-actions')).toBeInTheDocument();
    });

    it('applies correct CSS classes to buttons', () => {
      render(<CampaignInfo {...defaultProps} />);
      
      const backButton = screen.getByText('Back');
      const nextButton = screen.getByText('Next');
      
      expect(backButton).toHaveClass('btn', 'btn-secondary');
      expect(nextButton).toHaveClass('btn', 'btn-primary');
    });
  });

  describe('Form Field Behavior', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('accepts text input in campaign name field', async () => {
      render(<CampaignInfo {...defaultProps} />);
      
      const campaignNameInput = screen.getByRole('textbox', { name: /Campaign Name/i });
      await user.type(campaignNameInput, 'My Campaign 2024');
      
      expect(campaignNameInput.value).toBe('My Campaign 2024');
    });

    it('accepts URL input in website field', async () => {
      render(<CampaignInfo {...defaultProps} />);
      
      const websiteInput = screen.getByRole('textbox', { name: /Website/i });
      await user.type(websiteInput, 'https://mycampaign.org');
      
      expect(websiteInput.value).toBe('https://mycampaign.org');
    });

    it('handles special characters in inputs', async () => {
      render(<CampaignInfo {...defaultProps} />);
      
      const campaignNameInput = screen.getByRole('textbox', { name: /Campaign Name/i });
      await user.type(campaignNameInput, 'Campaign & Progress 2024!');
      
      expect(campaignNameInput.value).toBe('Campaign & Progress 2024!');
    });

    it('handles long input values', async () => {
      render(<CampaignInfo {...defaultProps} />);
      
      const longCampaignName = 'A Very Long Campaign Name That Exceeds Normal Length Expectations For Testing Purposes';
      
      const campaignNameInput = screen.getByRole('textbox', { name: /Campaign Name/i });
      await user.type(campaignNameInput, longCampaignName);
      
      expect(campaignNameInput.value).toBe(longCampaignName);
    });
  });

  describe('Props Integration', () => {
    it('correctly passes through all required props', () => {
      const customProps = {
        formData: {
          campaignName: 'Test Campaign',
          website: 'https://test.com'
        },
        updateFormData: vi.fn(),
        onNext: vi.fn(),
        onPrev: vi.fn()
      };

      render(<CampaignInfo {...customProps} />);
      
      // Component should render without errors and use the props
      expect(screen.getByDisplayValue('Test Campaign')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://test.com')).toBeInTheDocument();
    });

    it('handles missing form data properties gracefully', () => {
      const propsWithPartialData = {
        ...defaultProps,
        formData: {
          campaignName: 'Only Name Provided'
          // website is missing
        }
      };

      render(<CampaignInfo {...propsWithPartialData} />);
      
      const campaignNameInput = screen.getByRole('textbox', { name: /Campaign Name/i });
      const websiteInput = screen.getByRole('textbox', { name: /Website/i });
      
      expect(campaignNameInput.value).toBe('Only Name Provided');
      expect(websiteInput.value).toBe(''); // Should default to empty string
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<CampaignInfo {...defaultProps} />);
      
      expect(screen.getByLabelText(/Campaign Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Website/i)).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(<CampaignInfo {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Campaign Information');
    });

    it('has accessible buttons', () => {
      render(<CampaignInfo {...defaultProps} />);
      
      const backButton = screen.getByRole('button', { name: /Back/i });
      const nextButton = screen.getByRole('button', { name: /Next/i });
      
      expect(backButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('maintains focus when typing in inputs', async () => {
      const user = userEvent.setup();
      render(<CampaignInfo {...defaultProps} />);
      
      const campaignNameInput = screen.getByRole('textbox', { name: /Campaign Name/i });
      await user.click(campaignNameInput);
      await user.type(campaignNameInput, 'Test');
      
      expect(campaignNameInput).toHaveFocus();
    });
  });

  describe('Component Snapshots', () => {
    it('matches snapshot for empty form', () => {
      const { container } = render(<CampaignInfo {...defaultProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for populated form', () => {
      const propsWithData = {
        ...defaultProps,
        formData: {
          campaignName: 'Test Campaign 2024',
          website: 'https://test-campaign.org'
        }
      };

      const { container } = render(<CampaignInfo {...propsWithData} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});