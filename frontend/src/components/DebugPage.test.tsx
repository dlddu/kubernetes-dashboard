import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DebugPage } from './DebugPage';
import type { ApiLog } from '../contexts/DebugContext';

// Mock DebugContext
vi.mock('../contexts/DebugContext', () => ({
  useDebugContext: vi.fn(),
  ApiLog: {} as ApiLog,
}));

// Import after mock setup
import { useDebugContext } from '../contexts/DebugContext';

describe('DebugPage Component', () => {
  const mockLogs: ApiLog[] = [
    {
      method: 'GET',
      url: '/api/v1/pods',
      status: 200,
      timestamp: 1234567890000,
      duration: 123.45,
      responseBody: { items: [] },
      responseSize: 1024,
      params: { namespace: 'default' },
    },
    {
      method: 'POST',
      url: '/api/v1/deployments',
      status: 201,
      timestamp: 1234567891000,
      duration: 234.56,
      responseBody: { success: true },
      responseSize: 512,
    },
    {
      method: 'DELETE',
      url: '/api/v1/services/nginx',
      status: 404,
      timestamp: 1234567892000,
      duration: 45.67,
      responseBody: { error: 'Not found' },
      responseSize: 256,
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Empty State', () => {
    it('should render empty state when debug mode is off and no logs', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: false,
        logs: [],
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);

      // Assert
      const emptyState = screen.getByTestId('debug-empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(screen.getByText('No API calls logged')).toBeInTheDocument();
      expect(screen.getByText('Enable debug mode to start capturing API calls.')).toBeInTheDocument();
    });

    it('should render empty state when debug mode is on but no logs yet', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: [],
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);

      // Assert
      const emptyState = screen.getByTestId('debug-empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(screen.getByText('No logs yet')).toBeInTheDocument();
      expect(screen.getByText('Navigate to other pages to generate API calls.')).toBeInTheDocument();
    });
  });

  describe('Root Element', () => {
    it('should render root element with data-testid when logs exist', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);

      // Assert
      const root = screen.getByTestId('debug-page');
      expect(root).toBeInTheDocument();
    });
  });

  describe('Two-Panel Layout', () => {
    it('should render endpoint list panel', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);

      // Assert
      const endpointList = screen.getByTestId('endpoint-list');
      expect(endpointList).toBeInTheDocument();
    });

    it('should render all endpoint items', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);

      // Assert
      const items = screen.getAllByTestId('endpoint-item');
      expect(items).toHaveLength(mockLogs.length);
    });

    it('should display endpoint method and status', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);

      // Assert
      expect(screen.getByText('GET')).toBeInTheDocument();
      expect(screen.getByText('POST')).toBeInTheDocument();
      expect(screen.getByText('DELETE')).toBeInTheDocument();

      const statusCodes = screen.getAllByTestId('status-code');
      expect(statusCodes[0]).toHaveTextContent('200');
      expect(statusCodes[1]).toHaveTextContent('201');
      expect(statusCodes[2]).toHaveTextContent('404');
    });
  });

  describe('Tab Navigation', () => {
    it('should render Response, Request, and Metadata tabs', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      // Assert
      expect(screen.getByRole('tab', { name: /response/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /request/i })).toBeInTheDocument();
      expect(screen.getByTestId('metadata-tab')).toBeInTheDocument();
    });

    it('should switch to Request tab when clicked', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      const requestTab = screen.getByRole('tab', { name: /request/i });
      fireEvent.click(requestTab);

      // Assert
      expect(requestTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Method')).toBeInTheDocument();
      expect(screen.getByText('URL')).toBeInTheDocument();
    });

    it('should switch to Metadata tab when clicked', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      const metadataTab = screen.getByTestId('metadata-tab');
      fireEvent.click(metadataTab);

      // Assert
      expect(metadataTab).toHaveAttribute('aria-selected', 'true');
      const metadataContent = screen.getByTestId('metadata-content');
      expect(metadataContent).toBeInTheDocument();
    });
  });

  describe('Copy to Clipboard - Response Tab', () => {
    let mockClipboard: { writeText: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };
      Object.assign(navigator, {
        clipboard: mockClipboard,
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should render Copy button in Response tab', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      // Assert
      const copyButton = screen.getByTestId('copy-response-button');
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toHaveTextContent(/copy/i);
    });

    it('should copy response body to clipboard when Copy button is clicked', async () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      const copyButton = screen.getByTestId('copy-response-button');
      fireEvent.click(copyButton);

      // Assert
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          JSON.stringify(mockLogs[0].responseBody, null, 2)
        );
      });
    });

    it('should show "Copied!" feedback when copy is successful', async () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      const copyButton = screen.getByTestId('copy-response-button');
      fireEvent.click(copyButton);

      // Assert
      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Copied!');
      });
    });

    it('should restore button text after 1.5 seconds', async () => {
      // Arrange
      vi.useFakeTimers();
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      const copyButton = screen.getByTestId('copy-response-button');
      fireEvent.click(copyButton);

      // Wait for "Copied!" to appear
      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Copied!');
      });

      // Fast-forward 1.5 seconds
      vi.advanceTimersByTime(1500);

      // Assert
      await waitFor(() => {
        expect(copyButton).toHaveTextContent(/copy/i);
        expect(copyButton).not.toHaveTextContent('Copied!');
      });

      vi.useRealTimers();
    });

    it('should handle clipboard write failure gracefully', async () => {
      // Arrange
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard access denied'));
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      const copyButton = screen.getByTestId('copy-response-button');
      fireEvent.click(copyButton);

      // Assert - should not show "Copied!" on failure
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });

      // Button should remain in original state
      expect(copyButton).toHaveTextContent(/copy/i);
    });

    it('should not render Copy button in Request tab', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      const requestTab = screen.getByRole('tab', { name: /request/i });
      fireEvent.click(requestTab);

      // Assert
      const copyButton = screen.queryByTestId('copy-response-button');
      expect(copyButton).not.toBeInTheDocument();
    });

    it('should not render Copy button in Metadata tab', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      const metadataTab = screen.getByTestId('metadata-tab');
      fireEvent.click(metadataTab);

      // Assert
      const copyButton = screen.queryByTestId('copy-response-button');
      expect(copyButton).not.toBeInTheDocument();
    });

    it('should copy different response body when switching endpoints', async () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);

      // Select first endpoint
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      let copyButton = screen.getByTestId('copy-response-button');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          JSON.stringify(mockLogs[0].responseBody, null, 2)
        );
      });

      // Select second endpoint
      const secondItem = screen.getAllByTestId('endpoint-item')[1];
      fireEvent.click(secondItem);

      copyButton = screen.getByTestId('copy-response-button');
      fireEvent.click(copyButton);

      // Assert
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          JSON.stringify(mockLogs[1].responseBody, null, 2)
        );
      });
    });
  });

  describe('Copy to Clipboard - Request Tab', () => {
    let mockClipboard: { writeText: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };
      Object.assign(navigator, {
        clipboard: mockClipboard,
      });
    });

    it('should render Copy button in Request tab', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      const requestTab = screen.getByRole('tab', { name: /request/i });
      fireEvent.click(requestTab);

      // Assert
      const copyButton = screen.getByTestId('copy-request-button');
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toHaveTextContent(/copy/i);
    });

    it('should copy request data to clipboard when Copy button is clicked', async () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      const requestTab = screen.getByRole('tab', { name: /request/i });
      fireEvent.click(requestTab);

      const copyButton = screen.getByTestId('copy-request-button');
      fireEvent.click(copyButton);

      // Assert
      const expectedRequestData = {
        method: mockLogs[0].method,
        url: mockLogs[0].url,
        params: mockLogs[0].params,
      };

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          JSON.stringify(expectedRequestData, null, 2)
        );
      });
    });

    it('should show "Copied!" feedback in Request tab', async () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      const requestTab = screen.getByRole('tab', { name: /request/i });
      fireEvent.click(requestTab);

      const copyButton = screen.getByTestId('copy-request-button');
      fireEvent.click(copyButton);

      // Assert
      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Copied!');
      });
    });
  });

  describe('Endpoint Selection', () => {
    it('should show placeholder when no endpoint is selected', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);

      // Assert
      expect(screen.getByText('Select an endpoint to view details')).toBeInTheDocument();
    });

    it('should highlight selected endpoint', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const items = screen.getAllByTestId('endpoint-item');
      fireEvent.click(items[1]);

      // Assert
      expect(items[1].className).toMatch(/bg-blue|selected|active/);
    });

    it('should display response content when endpoint is selected', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      // Assert
      const responsePanel = screen.getByRole('tabpanel');
      expect(responsePanel).toBeInTheDocument();
      expect(responsePanel.textContent).toContain('items');
    });

    it('should reset to Response tab when selecting new endpoint', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const items = screen.getAllByTestId('endpoint-item');

      // Select first endpoint and switch to Metadata tab
      fireEvent.click(items[0]);
      const metadataTab = screen.getByTestId('metadata-tab');
      fireEvent.click(metadataTab);

      // Select second endpoint
      fireEvent.click(items[1]);

      // Assert
      const responseTab = screen.getByRole('tab', { name: /response/i });
      expect(responseTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Status Code Styling', () => {
    it('should apply success styling to 2xx status codes', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);

      // Assert
      const statusCodes = screen.getAllByTestId('status-code');
      expect(statusCodes[0].className).toMatch(/green/);
      expect(statusCodes[1].className).toMatch(/green/);
    });

    it('should apply error styling to 4xx/5xx status codes', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);

      // Assert
      const statusCodes = screen.getAllByTestId('status-code');
      expect(statusCodes[2].className).toMatch(/red/);
    });
  });

  describe('Metadata Display', () => {
    it('should display timestamp in Metadata tab', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      const metadataTab = screen.getByTestId('metadata-tab');
      fireEvent.click(metadataTab);

      // Assert
      const timestamp = screen.getByTestId('request-timestamp');
      expect(timestamp).toBeInTheDocument();
      expect(timestamp.textContent).toContain('T');
    });

    it('should display duration in Metadata tab', () => {
      // Arrange
      vi.mocked(useDebugContext).mockReturnValue({
        isDebugMode: true,
        logs: mockLogs,
        toggleDebugMode: vi.fn(),
        addLog: vi.fn(),
        clearLogs: vi.fn(),
      });

      // Act
      render(<DebugPage />);
      const firstItem = screen.getAllByTestId('endpoint-item')[0];
      fireEvent.click(firstItem);

      const metadataTab = screen.getByTestId('metadata-tab');
      fireEvent.click(metadataTab);

      // Assert
      const duration = screen.getByTestId('request-duration');
      expect(duration).toBeInTheDocument();
      expect(duration.textContent).toContain('ms');
    });
  });
});
