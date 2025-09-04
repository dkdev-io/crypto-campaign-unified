import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '../../../utils/test-utils';
import CampaignManager from '../CampaignManager';
import { supabase, configureSupabaseMock } from '../../../__mocks__/supabase';

// Mock the supabase module
vi.mock('../../../lib/supabase', () => ({
  supabase: supabase,
}));

describe('CampaignManager', () => {
  const mockCampaigns = [
    {
      id: 'campaign-1',
      campaign_name: 'Test Campaign 1',
      email: 'test1@example.com',
      suggested_amounts: [25, 50, 100, 250],
      max_donation_limit: 3300,
      created_at: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'campaign-2',
      campaign_name: 'Test Campaign 2',
      email: 'test2@example.com',
      suggested_amounts: [10, 20, 50],
      max_donation_limit: 2800,
      created_at: '2024-01-02T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    configureSupabaseMock.reset();
    configureSupabaseMock.setCampaignsResponse(mockCampaigns);
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mock window methods
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Loading', () => {
    it('shows loading state initially', () => {
      render(<CampaignManager />);
      expect(screen.getByText('Loading campaigns...')).toBeInTheDocument();
    });

    it('loads and displays campaigns successfully', async () => {
      render(<CampaignManager />);

      await waitFor(() => {
        expect(screen.getByText('🔧 Campaign Manager')).toBeInTheDocument();
        expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
        expect(screen.getByText('Test Campaign 2')).toBeInTheDocument();
      });

      expect(screen.getByText(/Total Campaigns.*2/)).toBeInTheDocument();
    });

    it('displays error when loading fails', async () => {
      configureSupabaseMock.setCampaignsResponse(null, { message: 'Database connection failed' });

      render(<CampaignManager />);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText(/Database connection failed/)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('retries loading when retry button is clicked', async () => {
      configureSupabaseMock.setCampaignsResponse(null, { message: 'Network error' });

      render(<CampaignManager />);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      // Reset mock to successful response
      configureSupabaseMock.setCampaignsResponse(mockCampaigns);

      const retryButton = screen.getByText('Retry');
      await userEvent.setup().click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
      });
    });
  });

  describe('Campaign Display', () => {
    beforeEach(async () => {
      render(<CampaignManager />);
      await waitFor(() => screen.getByText('Test Campaign 1'));
    });

    it('renders campaign table with correct headers', () => {
      expect(screen.getByText('Campaign')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Suggested Amounts')).toBeInTheDocument();
      expect(screen.getByText('Max Donation')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('displays campaign information correctly', () => {
      expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
      expect(screen.getByText('test1@example.com')).toBeInTheDocument();
      expect(screen.getByText('[25, 50, 100, 250]')).toBeInTheDocument();
      expect(screen.getByText('$3300')).toBeInTheDocument();

      expect(screen.getByText('Test Campaign 2')).toBeInTheDocument();
      expect(screen.getByText('[10, 20, 50]')).toBeInTheDocument();
      expect(screen.getByText('$2800')).toBeInTheDocument();
    });

    it('renders action buttons for each campaign', () => {
      const editButtons = screen.getAllByText('✏️ Edit');
      const deleteButtons = screen.getAllByText('🗑️ Delete');

      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });

    it('renders view form links', () => {
      const viewLinks = screen.getAllByText('🔗 View Form');
      expect(viewLinks).toHaveLength(2);

      expect(viewLinks[0]).toHaveAttribute('href', 'http://localhost:5173/?campaign=campaign-1');
      expect(viewLinks[1]).toHaveAttribute('href', 'http://localhost:5173/?campaign=campaign-2');
    });
  });

  describe('Campaign Editing', () => {
    let user;

    beforeEach(async () => {
      user = userEvent.setup();
      render(<CampaignManager />);
      await waitFor(() => screen.getByText('Test Campaign 1'));
    });

    it('enters edit mode when edit button is clicked', async () => {
      const editButton = screen.getAllByText('✏️ Edit')[0];
      await user.click(editButton);

      // Check edit mode UI
      expect(screen.getByDisplayValue('25, 50, 100, 250')).toBeInTheDocument();
      expect(screen.getByText('✅ Save')).toBeInTheDocument();
      expect(screen.getByText('❌ Cancel')).toBeInTheDocument();
    });

    it('allows editing of suggested amounts', async () => {
      const editButton = screen.getAllByText('✏️ Edit')[0];
      await user.click(editButton);

      const input = screen.getByDisplayValue('25, 50, 100, 250');
      await user.clear(input);
      await user.type(input, '30, 60, 120, 300');

      expect(input.value).toBe('30, 60, 120, 300');
    });

    it('saves edited amounts successfully', async () => {
      configureSupabaseMock.setUpdateResponse({
        id: 'campaign-1',
        suggested_amounts: [30, 60, 120, 300],
      });

      const editButton = screen.getAllByText('✏️ Edit')[0];
      await user.click(editButton);

      const input = screen.getByDisplayValue('25, 50, 100, 250');
      await user.clear(input);
      await user.type(input, '30, 60, 120, 300');

      const saveButton = screen.getByText('✅ Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('campaigns');
      });

      expect(window.alert).toHaveBeenCalledWith('✅ Amounts updated to: [30, 60, 120, 300]');
    });

    it('validates amounts before saving', async () => {
      const editButton = screen.getAllByText('✏️ Edit')[0];
      await user.click(editButton);

      const input = screen.getByDisplayValue('25, 50, 100, 250');
      await user.clear(input);
      await user.type(input, 'invalid, amounts');

      const saveButton = screen.getByText('✅ Save');
      await user.click(saveButton);

      expect(window.alert).toHaveBeenCalledWith(
        'Please enter valid amounts (e.g., "25, 50, 100, 250")'
      );
    });

    it('handles save errors gracefully', async () => {
      configureSupabaseMock.setUpdateResponse(null, { message: 'Update failed' });

      const editButton = screen.getAllByText('✏️ Edit')[0];
      await user.click(editButton);

      const saveButton = screen.getByText('✅ Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to update amounts: Update failed');
      });
    });

    it('cancels editing when cancel button is clicked', async () => {
      const editButton = screen.getAllByText('✏️ Edit')[0];
      await user.click(editButton);

      const input = screen.getByDisplayValue('25, 50, 100, 250');
      await user.clear(input);
      await user.type(input, 'changed amounts');

      const cancelButton = screen.getByText('❌ Cancel');
      await user.click(cancelButton);

      // Should exit edit mode and revert to display
      expect(screen.getByText('[25, 50, 100, 250]')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('changed amounts')).not.toBeInTheDocument();
    });
  });

  describe('Campaign Deletion', () => {
    let user;

    beforeEach(async () => {
      user = userEvent.setup();
      render(<CampaignManager />);
      await waitFor(() => screen.getByText('Test Campaign 1'));
    });

    it('confirms deletion before proceeding', async () => {
      const deleteButton = screen.getAllByText('🗑️ Delete')[0];
      await user.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "Test Campaign 1"?'
      );
    });

    it('deletes campaign successfully', async () => {
      configureSupabaseMock.setDeleteResponse(true);

      const deleteButton = screen.getAllByText('🗑️ Delete')[0];
      await user.click(deleteButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('campaigns');
      });

      expect(window.alert).toHaveBeenCalledWith('✅ Deleted "Test Campaign 1"');
    });

    it('handles deletion errors', async () => {
      configureSupabaseMock.setDeleteResponse(null, { message: 'Delete failed' });

      const deleteButton = screen.getAllByText('🗑️ Delete')[0];
      await user.click(deleteButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to delete campaign: Delete failed');
      });
    });

    it('cancels deletion when user clicks cancel', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      const deleteButton = screen.getAllByText('🗑️ Delete')[0];
      await user.click(deleteButton);

      expect(supabase.from).not.toHaveBeenCalledWith('campaigns');
    });
  });

  describe('UI Navigation', () => {
    beforeEach(async () => {
      render(<CampaignManager />);
      await waitFor(() => screen.getByText('Test Campaign 1'));
    });

    it('renders refresh button and back link', () => {
      expect(screen.getByText('🔄 Refresh')).toBeInTheDocument();
      expect(screen.getByText('← Back to Setup')).toBeInTheDocument();
    });

    it('back link has correct href', () => {
      const backLink = screen.getByText('← Back to Setup');
      expect(backLink).toHaveAttribute('href', '/');
    });

    it('refresh button triggers campaign reload', async () => {
      const user = userEvent.setup();
      const refreshButton = screen.getByText('🔄 Refresh');

      await user.click(refreshButton);

      // Should call supabase again
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('campaigns');
      });
    });
  });

  describe('Usage Tips', () => {
    beforeEach(async () => {
      render(<CampaignManager />);
      await waitFor(() => screen.getByText('Test Campaign 1'));
    });

    it('displays usage tips section', () => {
      expect(screen.getByText('💡 Usage Tips:')).toBeInTheDocument();
      expect(screen.getByText(/Edit Amounts.*Click "Edit"/)).toBeInTheDocument();
      expect(screen.getByText(/Test Campaigns.*Click "View Form"/)).toBeInTheDocument();
      expect(screen.getByText(/Delete Campaigns.*Remove test campaigns/)).toBeInTheDocument();
      expect(screen.getByText(/Amount Format.*"25, 50, 100, 250"/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<CampaignManager />);
      await waitFor(() => screen.getByText('Test Campaign 1'));
    });

    it('has proper table structure', () => {
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(6);
    });

    it('has accessible buttons with proper text', () => {
      const editButtons = screen.getAllByRole('button', { name: /Edit/ });
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      const refreshButton = screen.getByRole('button', { name: /Refresh/ });

      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
      expect(refreshButton).toBeInTheDocument();
    });

    it('has accessible links with proper href attributes', () => {
      const viewLinks = screen.getAllByRole('link', { name: /View Form/ });
      const backLink = screen.getByRole('link', { name: /Back to Setup/ });

      expect(viewLinks).toHaveLength(2);
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });
  });

  describe('Component Snapshots', () => {
    it('matches snapshot for loading state', () => {
      const { container } = render(<CampaignManager />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for loaded campaigns', async () => {
      render(<CampaignManager />);

      await waitFor(() => screen.getByText('Test Campaign 1'));

      const { container } = render(<CampaignManager />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for error state', async () => {
      configureSupabaseMock.setCampaignsResponse(null, { message: 'Error' });

      render(<CampaignManager />);

      await waitFor(() => screen.getByText('Error'));

      const { container } = render(<CampaignManager />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
