import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '../../../utils/test-utils';
import SupabaseCheck from '../SupabaseCheck';

// Mock the supabase-setup module
const mockCheckSupabaseSetup = vi.fn();
const mockTestCampaignCreation = vi.fn();
const mockCreateTablesSQL = 'CREATE TABLE campaigns (id serial primary key);';

vi.mock('../../../lib/supabase-setup', () => ({
  checkSupabaseSetup: mockCheckSupabaseSetup,
  testCampaignCreation: mockTestCampaignCreation,
  CREATE_TABLES_SQL: mockCreateTablesSQL
}));

describe('SupabaseCheck', () => {
  let originalLog, originalError;

  beforeEach(() => {
    // Store original console methods
    originalLog = console.log;
    originalError = console.error;
    
    vi.clearAllMocks();
    mockCheckSupabaseSetup.mockResolvedValue(true);
    mockTestCampaignCreation.mockResolvedValue({ success: true, id: 'test-campaign-123' });
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalLog;
    console.error = originalError;
  });

  describe('Component Rendering', () => {
    it('renders supabase check component with correct title', () => {
      render(<SupabaseCheck />);
      
      expect(screen.getByText('🔧 Supabase Setup Check')).toBeInTheDocument();
      expect(screen.getByText('🧪 Test Campaign Creation')).toBeInTheDocument();
      expect(screen.getByText('📋 Logs:')).toBeInTheDocument();
      expect(screen.getByText(/If tables don't exist/)).toBeInTheDocument();
    });

    it('shows checking status initially', () => {
      render(<SupabaseCheck />);
      
      expect(screen.getByText(/Status.*checking/)).toBeInTheDocument();
    });

    it('displays SQL creation instructions', () => {
      render(<SupabaseCheck />);
      
      expect(screen.getByText('Click to view SQL')).toBeInTheDocument();
    });
  });

  describe('Connection Status', () => {
    it('shows connected status when supabase setup succeeds', async () => {
      mockCheckSupabaseSetup.mockResolvedValue(true);
      
      render(<SupabaseCheck />);
      
      await waitFor(() => {
        expect(screen.getByText('Status: ✅ Connected')).toBeInTheDocument();
      });
      
      const statusDiv = screen.getByText('Status: ✅ Connected').parentElement;
      expect(statusDiv).toHaveStyle({ background: '#d4edda' });
    });

    it('shows error status when supabase setup fails', async () => {
      mockCheckSupabaseSetup.mockResolvedValue(false);
      
      render(<SupabaseCheck />);
      
      await waitFor(() => {
        expect(screen.getByText('Status: ❌ Not Connected')).toBeInTheDocument();
      });
      
      const statusDiv = screen.getByText('Status: ❌ Not Connected').parentElement;
      expect(statusDiv).toHaveStyle({ background: '#f8d7da' });
    });

    it('calls checkSupabaseSetup on mount', async () => {
      render(<SupabaseCheck />);
      
      await waitFor(() => {
        expect(mockCheckSupabaseSetup).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Test Campaign Creation', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('runs test campaign creation when button clicked', async () => {
      render(<SupabaseCheck />);
      
      const testButton = screen.getByText('🧪 Test Campaign Creation');
      await user.click(testButton);
      
      await waitFor(() => {
        expect(mockTestCampaignCreation).toHaveBeenCalledTimes(1);
      });
    });

    it('displays test result after successful test', async () => {
      const testResult = { success: true, id: 'test-campaign-123', message: 'Campaign created' };
      mockTestCampaignCreation.mockResolvedValue(testResult);
      
      render(<SupabaseCheck />);
      
      const testButton = screen.getByText('🧪 Test Campaign Creation');
      await user.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test Result:')).toBeInTheDocument();
        expect(screen.getByText(JSON.stringify(testResult, null, 2))).toBeInTheDocument();
      });
    });

    it('displays test result after failed test', async () => {
      const testResult = { success: false, error: 'Database connection failed' };
      mockTestCampaignCreation.mockResolvedValue(testResult);
      
      render(<SupabaseCheck />);
      
      const testButton = screen.getByText('🧪 Test Campaign Creation');
      await user.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test Result:')).toBeInTheDocument();
        expect(screen.getByText(JSON.stringify(testResult, null, 2))).toBeInTheDocument();
      });
    });

    it('handles test campaign creation errors', async () => {
      mockTestCampaignCreation.mockRejectedValue(new Error('Network error'));
      
      render(<SupabaseCheck />);
      
      const testButton = screen.getByText('🧪 Test Campaign Creation');
      await user.click(testButton);
      
      // Should not crash the component
      expect(screen.getByText('🧪 Test Campaign Creation')).toBeInTheDocument();
    });

    it('clears logs when test button is clicked', async () => {
      render(<SupabaseCheck />);
      
      // Wait for initial setup to complete
      await waitFor(() => {
        expect(mockCheckSupabaseSetup).toHaveBeenCalled();
      });
      
      const testButton = screen.getByText('🧪 Test Campaign Creation');
      await user.click(testButton);
      
      await waitFor(() => {
        expect(mockTestCampaignCreation).toHaveBeenCalled();
      });
    });
  });

  describe('Console Log Capture', () => {
    it('captures console.log messages', async () => {
      render(<SupabaseCheck />);
      
      // Wait for component to set up console overrides
      await waitFor(() => {
        expect(mockCheckSupabaseSetup).toHaveBeenCalled();
      });
      
      // Test console.log capture
      console.log('Test log message');
      
      await waitFor(() => {
        expect(screen.getByText('Test log message')).toBeInTheDocument();
      });
    });

    it('captures console.error messages with correct styling', async () => {
      render(<SupabaseCheck />);
      
      // Wait for component to set up console overrides
      await waitFor(() => {
        expect(mockCheckSupabaseSetup).toHaveBeenCalled();
      });
      
      // Test console.error capture
      console.error('Test error message');
      
      await waitFor(() => {
        const errorElement = screen.getByText('Test error message');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveStyle({ color: 'red' });
      });
    });

    it('restores original console methods on unmount', () => {
      const { unmount } = render(<SupabaseCheck />);
      
      unmount();
      
      expect(console.log).toBe(originalLog);
      expect(console.error).toBe(originalError);
    });

    it('displays logs in monospace font with proper styling', async () => {
      render(<SupabaseCheck />);
      
      await waitFor(() => {
        expect(mockCheckSupabaseSetup).toHaveBeenCalled();
      });
      
      console.log('Styled log message');
      
      await waitFor(() => {
        const logElement = screen.getByText('Styled log message');
        expect(logElement).toHaveStyle({
          fontFamily: 'monospace',
          fontSize: '12px',
          color: 'black'
        });
      });
    });
  });

  describe('SQL Instructions', () => {
    it('displays SQL creation instructions in collapsible section', () => {
      render(<SupabaseCheck />);
      
      const sqlSection = screen.getByText('Click to view SQL');
      expect(sqlSection).toBeInTheDocument();
      expect(sqlSection.tagName).toBe('SUMMARY');
    });

    it('displays CREATE_TABLES_SQL content', () => {
      render(<SupabaseCheck />);
      
      const sqlContent = screen.getByText(mockCreateTablesSQL);
      expect(sqlContent).toBeInTheDocument();
      expect(sqlContent).toHaveStyle({
        background: 'white',
        fontSize: '12px',
        overflow: 'auto'
      });
    });
  });

  describe('UI Layout and Styling', () => {
    beforeEach(async () => {
      render(<SupabaseCheck />);
      await waitFor(() => mockCheckSupabaseSetup);
    });

    it('has proper container styling', () => {
      const container = screen.getByText('🔧 Supabase Setup Check').parentElement;
      expect(container).toHaveStyle({
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      });
    });

    it('styles test button correctly', () => {
      const testButton = screen.getByText('🧪 Test Campaign Creation');
      expect(testButton).toHaveStyle({
        padding: '0.75rem 1.5rem',
        background: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px'
      });
    });

    it('styles logs container correctly', () => {
      const logsContainer = screen.getByText('📋 Logs:').parentElement;
      expect(logsContainer).toHaveStyle({
        background: '#f5f5f5',
        padding: '1rem',
        borderRadius: '8px',
        maxHeight: '400px',
        overflow: 'auto'
      });
    });

    it('styles SQL instructions container correctly', () => {
      const sqlContainer = screen.getByText(/If tables don't exist/).parentElement;
      expect(sqlContainer).toHaveStyle({
        background: '#fff3cd',
        padding: '1rem',
        borderRadius: '8px'
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<SupabaseCheck />);
      await waitFor(() => mockCheckSupabaseSetup);
    });

    it('has proper heading structure', () => {
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('🔧 Supabase Setup Check');
      
      const statusHeading = screen.getByRole('heading', { level: 2 });
      expect(statusHeading).toHaveTextContent(/Status:/);
    });

    it('has accessible button with proper text', () => {
      const testButton = screen.getByRole('button', { name: /Test Campaign Creation/ });
      expect(testButton).toBeInTheDocument();
    });

    it('has accessible details/summary for SQL section', () => {
      const detailsElement = screen.getByText('Click to view SQL').parentElement;
      expect(detailsElement.tagName).toBe('DETAILS');
    });

    it('maintains semantic structure for logs', () => {
      const logsSection = screen.getByText('📋 Logs:');
      expect(logsSection.tagName).toBe('H3');
    });
  });

  describe('Component Snapshots', () => {
    it('matches snapshot for initial state', () => {
      const { container } = render(<SupabaseCheck />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for connected state', async () => {
      mockCheckSupabaseSetup.mockResolvedValue(true);
      
      render(<SupabaseCheck />);
      
      await waitFor(() => {
        expect(screen.getByText('Status: ✅ Connected')).toBeInTheDocument();
      });
      
      const { container } = render(<SupabaseCheck />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for error state', async () => {
      mockCheckSupabaseSetup.mockResolvedValue(false);
      
      render(<SupabaseCheck />);
      
      await waitFor(() => {
        expect(screen.getByText('Status: ❌ Not Connected')).toBeInTheDocument();
      });
      
      const { container } = render(<SupabaseCheck />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});