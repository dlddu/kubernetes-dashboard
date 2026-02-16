import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DebugDetailView } from './DebugDetailView';

// Mock clipboard API
const mockWriteText = vi.fn(() => Promise.resolve());
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

// Test data
const mockApiLog = {
  method: 'GET',
  url: '/api/pods',
  params: { namespace: 'default', limit: 10 },
  status: 200,
  timestamp: 1707955200000, // 2024-02-15 00:00:00 UTC
  duration: 125,
  responseBody: {
    items: [
      { name: 'pod-1', status: 'Running' },
      { name: 'pod-2', status: 'Pending' },
    ],
    total: 2,
  },
  responseSize: 1024,
};

describe('DebugDetailView', () => {
  beforeEach(() => {
    mockWriteText.mockClear();
  });

  describe('rendering - basic structure', () => {
    it('should render without crashing when selectedLog is null', () => {
      // Act
      render(<DebugDetailView selectedLog={null} />);

      // Assert
      const detailView = screen.getByTestId('detail-view');
      expect(detailView).toBeInTheDocument();
    });

    it('should render without crashing when selectedLog is provided', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const detailView = screen.getByTestId('detail-view');
      expect(detailView).toBeInTheDocument();
    });

    it('should display placeholder message when selectedLog is null', () => {
      // Act
      render(<DebugDetailView selectedLog={null} />);

      // Assert
      expect(screen.getByText(/select.*log.*view.*details/i)).toBeInTheDocument();
    });

    it('should not display placeholder when selectedLog is provided', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      expect(screen.queryByText(/select.*log.*view.*details/i)).not.toBeInTheDocument();
    });
  });

  describe('tab rendering and structure', () => {
    it('should render all three tabs when selectedLog is provided', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      expect(screen.getByTestId('tab-response')).toBeInTheDocument();
      expect(screen.getByTestId('tab-request')).toBeInTheDocument();
      expect(screen.getByTestId('tab-metadata')).toBeInTheDocument();
    });

    it('should render Response tab with correct label', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const responseTab = screen.getByTestId('tab-response');
      expect(responseTab).toHaveTextContent(/response/i);
    });

    it('should render Request tab with correct label', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const requestTab = screen.getByTestId('tab-request');
      expect(requestTab).toHaveTextContent(/request/i);
    });

    it('should render Metadata tab with correct label', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const metadataTab = screen.getByTestId('tab-metadata');
      expect(metadataTab).toHaveTextContent(/metadata/i);
    });

    it('should not render tabs when selectedLog is null', () => {
      // Act
      render(<DebugDetailView selectedLog={null} />);

      // Assert
      expect(screen.queryByTestId('tab-response')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab-request')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab-metadata')).not.toBeInTheDocument();
    });
  });

  describe('default active tab - Response', () => {
    it('should have Response tab active by default', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const responseTab = screen.getByTestId('tab-response');
      expect(responseTab.className).toMatch(/active|selected|bg-cyan|text-cyan/);
    });

    it('should have Request tab inactive by default', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const requestTab = screen.getByTestId('tab-request');
      expect(requestTab.className).not.toMatch(/active|selected|bg-cyan|text-cyan/);
    });

    it('should have Metadata tab inactive by default', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const metadataTab = screen.getByTestId('tab-metadata');
      expect(metadataTab.className).not.toMatch(/active|selected|bg-cyan|text-cyan/);
    });

    it('should display Response content by default', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert - Check for JSON content from response body
      expect(screen.getByText(/"pod-1"/)).toBeInTheDocument();
      expect(screen.getByText(/"Running"/)).toBeInTheDocument();
    });

    it('should not display Request content by default', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert - Request specific content should not be visible
      expect(screen.queryByText(/Method:/i)).not.toBeInTheDocument();
    });

    it('should not display Metadata content by default', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert - Metadata specific content should not be visible
      expect(screen.queryByText(/Timestamp:/i)).not.toBeInTheDocument();
    });
  });

  describe('tab switching functionality', () => {
    it('should switch to Request tab when clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      expect(requestTab.className).toMatch(/active|selected|bg-cyan|text-cyan/);
    });

    it('should switch to Metadata tab when clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      expect(metadataTab.className).toMatch(/active|selected|bg-cyan|text-cyan/);
    });

    it('should deactivate Response tab when Request tab is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const responseTab = screen.getByTestId('tab-response');
      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      expect(responseTab.className).not.toMatch(/active|selected|bg-cyan|text-cyan/);
    });

    it('should switch back to Response tab from Request tab', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const responseTab = screen.getByTestId('tab-response');
      const requestTab = screen.getByTestId('tab-request');

      // Act - Switch to Request then back to Response
      await user.click(requestTab);
      await user.click(responseTab);

      // Assert
      expect(responseTab.className).toMatch(/active|selected|bg-cyan|text-cyan/);
      expect(requestTab.className).not.toMatch(/active|selected|bg-cyan|text-cyan/);
    });

    it('should handle multiple tab switches', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const responseTab = screen.getByTestId('tab-response');
      const requestTab = screen.getByTestId('tab-request');
      const metadataTab = screen.getByTestId('tab-metadata');

      // Act - Multiple switches
      await user.click(requestTab);
      expect(requestTab.className).toMatch(/active|selected|bg-cyan|text-cyan/);

      await user.click(metadataTab);
      expect(metadataTab.className).toMatch(/active|selected|bg-cyan|text-cyan/);

      await user.click(responseTab);
      expect(responseTab.className).toMatch(/active|selected|bg-cyan|text-cyan/);
    });
  });

  describe('Response tab - JSON syntax highlighting', () => {
    it('should display response body as JSON', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert - Check for JSON content
      expect(screen.getByText(/"items"/)).toBeInTheDocument();
      expect(screen.getByText(/"total"/)).toBeInTheDocument();
    });

    it('should apply purple color to JSON keys', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert - Find elements with purple text color
      const detailView = screen.getByTestId('detail-view');
      const purpleElements = detailView.querySelectorAll('.text-purple-400, .text-purple-500');
      expect(purpleElements.length).toBeGreaterThan(0);
    });

    it('should apply amber color to string values', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert - Find elements with amber text color
      const detailView = screen.getByTestId('detail-view');
      const amberElements = detailView.querySelectorAll('.text-amber-400, .text-amber-500');
      expect(amberElements.length).toBeGreaterThan(0);
    });

    it('should apply cyan color to number values', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert - Find elements with cyan text color
      const detailView = screen.getByTestId('detail-view');
      const cyanElements = detailView.querySelectorAll('.text-cyan-400, .text-cyan-500');
      expect(cyanElements.length).toBeGreaterThan(0);
    });

    it('should display endpoint as comment in JSON', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert - Check for endpoint comment
      expect(screen.getByText(/\/api\/pods/)).toBeInTheDocument();
    });

    it('should have dark background (bg-gray-950)', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const detailView = screen.getByTestId('detail-view');
      const codeBlock = detailView.querySelector('.bg-gray-950');
      expect(codeBlock).toBeInTheDocument();
    });

    it('should use monospace font (font-mono)', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const detailView = screen.getByTestId('detail-view');
      const codeBlock = detailView.querySelector('.font-mono');
      expect(codeBlock).toBeInTheDocument();
    });

    it('should format nested JSON objects correctly', () => {
      // Arrange
      const logWithNestedJson = {
        ...mockApiLog,
        responseBody: {
          data: {
            nested: {
              deeply: {
                value: 'test',
              },
            },
          },
        },
      };

      // Act
      render(<DebugDetailView selectedLog={logWithNestedJson} />);

      // Assert - Check for nested structure
      expect(screen.getByText(/"data"/)).toBeInTheDocument();
      expect(screen.getByText(/"nested"/)).toBeInTheDocument();
      expect(screen.getByText(/"deeply"/)).toBeInTheDocument();
    });

    it('should handle arrays in JSON response', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert - Arrays should be displayed
      expect(screen.getByText(/\[/)).toBeInTheDocument(); // Opening bracket
    });
  });

  describe('Request tab - content display', () => {
    it('should display Method when Request tab is active', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      expect(screen.getByText(/Method:/i)).toBeInTheDocument();
      expect(screen.getByText('GET')).toBeInTheDocument();
    });

    it('should display URL when Request tab is active', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      expect(screen.getByText(/URL:/i)).toBeInTheDocument();
      expect(screen.getByText('/api/pods')).toBeInTheDocument();
    });

    it('should display Params when Request tab is active', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      expect(screen.getByText(/Params:/i)).toBeInTheDocument();
    });

    it('should display params as key-value pairs', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      expect(screen.getByText(/namespace/i)).toBeInTheDocument();
      expect(screen.getByText(/default/i)).toBeInTheDocument();
      expect(screen.getByText(/limit/i)).toBeInTheDocument();
    });

    it('should handle request with no params', async () => {
      // Arrange
      const user = userEvent.setup();
      const logWithoutParams = { ...mockApiLog, params: undefined };
      render(<DebugDetailView selectedLog={logWithoutParams} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      expect(screen.getByText(/Method:/i)).toBeInTheDocument();
      expect(screen.getByText(/URL:/i)).toBeInTheDocument();
    });

    it('should handle request with empty params object', async () => {
      // Arrange
      const user = userEvent.setup();
      const logWithEmptyParams = { ...mockApiLog, params: {} };
      render(<DebugDetailView selectedLog={logWithEmptyParams} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      expect(screen.getByText(/Params:/i)).toBeInTheDocument();
    });
  });

  describe('Metadata tab - content display', () => {
    it('should display Timestamp when Metadata tab is active', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      expect(screen.getByText(/Timestamp:/i)).toBeInTheDocument();
    });

    it('should display formatted timestamp', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert - Check for some date format (year, month, day, time)
      expect(screen.getByText(/2024|Feb|15/)).toBeInTheDocument();
    });

    it('should display Duration when Metadata tab is active', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      expect(screen.getByText(/Duration:/i)).toBeInTheDocument();
      expect(screen.getByText(/125.*ms/i)).toBeInTheDocument();
    });

    it('should display Status when Metadata tab is active', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      expect(screen.getByText(/Status:/i)).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('should display Content-Type when Metadata tab is active', async () => {
      // Arrange
      const user = userEvent.setup();
      const logWithContentType = {
        ...mockApiLog,
        contentType: 'application/json',
      };
      render(<DebugDetailView selectedLog={logWithContentType} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      expect(screen.getByText(/Content-Type:/i)).toBeInTheDocument();
    });

    it('should display Response Size when Metadata tab is active', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      expect(screen.getByText(/Response Size:/i)).toBeInTheDocument();
      expect(screen.getByText(/1024|1\.0.*KB/i)).toBeInTheDocument();
    });

    it('should format large response sizes correctly', async () => {
      // Arrange
      const user = userEvent.setup();
      const logWithLargeSize = {
        ...mockApiLog,
        responseSize: 1048576, // 1 MB
      };
      render(<DebugDetailView selectedLog={logWithLargeSize} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      expect(screen.getByText(/1\.0.*MB/i)).toBeInTheDocument();
    });
  });

  describe('Copy button - rendering and positioning', () => {
    it('should render copy button when selectedLog is provided', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const copyButton = screen.getByTestId('copy-button');
      expect(copyButton).toBeInTheDocument();
    });

    it('should not render copy button when selectedLog is null', () => {
      // Act
      render(<DebugDetailView selectedLog={null} />);

      // Assert
      expect(screen.queryByTestId('copy-button')).not.toBeInTheDocument();
    });

    it('should have Copy label initially', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const copyButton = screen.getByTestId('copy-button');
      expect(copyButton).toHaveTextContent(/copy/i);
    });

    it('should be a button element', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const copyButton = screen.getByTestId('copy-button');
      expect(copyButton.tagName).toBe('BUTTON');
    });
  });

  describe.skip('Copy button - functionality', () => {
    it('should copy Response tab content when clicked', async () => {
      // Arrange
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');

      // Act
      fireEvent.click(copyButton);

      // Assert
      await waitFor(() => expect(mockWriteText).toHaveBeenCalledTimes(1));
      const copiedContent = mockWriteText.mock.calls[0][0];
      expect(copiedContent).toContain('pod-1');
      expect(copiedContent).toContain('Running');
    });

    it('should copy Request tab content when active', async () => {
      // Arrange
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const requestTab = screen.getByTestId('tab-request');
      const copyButton = screen.getByTestId('copy-button');

      // Act - Switch to Request tab and copy
      await user.click(requestTab);
      fireEvent.click(copyButton);

      // Assert
      await waitFor(() => expect(mockWriteText).toHaveBeenCalledTimes(1));
      const copiedContent = mockWriteText.mock.calls[0][0];
      expect(copiedContent).toContain('GET');
      expect(copiedContent).toContain('/api/pods');
    });

    it('should copy Metadata tab content when active', async () => {
      // Arrange
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');
      const copyButton = screen.getByTestId('copy-button');

      // Act - Switch to Metadata tab and copy
      await user.click(metadataTab);
      fireEvent.click(copyButton);

      // Assert
      await waitFor(() => expect(mockWriteText).toHaveBeenCalledTimes(1));
      const copiedContent = mockWriteText.mock.calls[0][0];
      expect(copiedContent).toContain('200');
      expect(copiedContent).toContain('125');
    });

    it('should handle multiple copy clicks', async () => {
      // Arrange
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');

      // Act - Click copy multiple times
      fireEvent.click(copyButton);
      fireEvent.click(copyButton);
      fireEvent.click(copyButton);

      // Assert
      await waitFor(() => expect(mockWriteText).toHaveBeenCalledTimes(3));
    });
  });

  describe.skip('Copy button - feedback mechanism', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should show "Copied!" text after copy button is clicked', async () => {
      // Arrange
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');

      // Act
      fireEvent.click(copyButton);

      // Assert
      expect(copyButton).toHaveTextContent(/copied!/i);
    });

    it('should revert to "Copy" text after 1.5 seconds', async () => {
      // Arrange
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');

      // Act
      fireEvent.click(copyButton);
      expect(copyButton).toHaveTextContent(/copied!/i);

      // Advance timers by 1.5 seconds
      vi.advanceTimersByTime(1500);

      // Assert
      expect(copyButton).toHaveTextContent(/^copy$/i);
      expect(copyButton).not.toHaveTextContent(/copied!/i);
    });

    it('should not revert before 1.5 seconds', async () => {
      // Arrange
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');

      // Act
      fireEvent.click(copyButton);
      expect(copyButton).toHaveTextContent(/copied!/i);

      // Advance timers by less than 1.5 seconds
      vi.advanceTimersByTime(1000);

      // Assert - Should still show "Copied!"
      expect(copyButton).toHaveTextContent(/copied!/i);
    });

    it('should handle rapid copy clicks with feedback', async () => {
      // Arrange
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');

      // Act - Rapid clicks
      fireEvent.click(copyButton);
      expect(copyButton).toHaveTextContent(/copied!/i);

      vi.advanceTimersByTime(500);
      fireEvent.click(copyButton);

      // Assert - Should still show "Copied!" and reset timer
      expect(copyButton).toHaveTextContent(/copied!/i);

      vi.advanceTimersByTime(1500);
      expect(copyButton).toHaveTextContent(/^copy$/i);
    });
  });

  describe('controlled tab state via props', () => {
    it('should respect activeTab prop when set to "request"', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} activeTab="request" />);

      // Assert
      const requestTab = screen.getByTestId('tab-request');
      expect(requestTab.className).toMatch(/active|selected|bg-cyan|text-cyan/);
    });

    it('should respect activeTab prop when set to "metadata"', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} activeTab="metadata" />);

      // Assert
      const metadataTab = screen.getByTestId('tab-metadata');
      expect(metadataTab.className).toMatch(/active|selected|bg-cyan|text-cyan/);
    });

    it('should call onTabChange when tab is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const onTabChange = vi.fn();
      render(
        <DebugDetailView
          selectedLog={mockApiLog}
          onTabChange={onTabChange}
        />
      );

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      expect(onTabChange).toHaveBeenCalledTimes(1);
      expect(onTabChange).toHaveBeenCalledWith('request');
    });

    it('should call onTabChange with correct tab name for each tab', async () => {
      // Arrange
      const user = userEvent.setup();
      const onTabChange = vi.fn();
      render(
        <DebugDetailView
          selectedLog={mockApiLog}
          onTabChange={onTabChange}
        />
      );

      const requestTab = screen.getByTestId('tab-request');
      const metadataTab = screen.getByTestId('tab-metadata');
      const responseTab = screen.getByTestId('tab-response');

      // Act & Assert
      await user.click(requestTab);
      expect(onTabChange).toHaveBeenLastCalledWith('request');

      await user.click(metadataTab);
      expect(onTabChange).toHaveBeenLastCalledWith('metadata');

      await user.click(responseTab);
      expect(onTabChange).toHaveBeenLastCalledWith('response');
    });
  });

  describe('edge cases', () => {
    it('should handle empty response body', () => {
      // Arrange
      const logWithEmptyResponse = {
        ...mockApiLog,
        responseBody: {},
      };

      // Act
      render(<DebugDetailView selectedLog={logWithEmptyResponse} />);

      // Assert
      const detailView = screen.getByTestId('detail-view');
      expect(detailView).toBeInTheDocument();
    });

    it('should handle null response body', () => {
      // Arrange
      const logWithNullResponse = {
        ...mockApiLog,
        responseBody: null,
      };

      // Act
      render(<DebugDetailView selectedLog={logWithNullResponse} />);

      // Assert
      const detailView = screen.getByTestId('detail-view');
      expect(detailView).toBeInTheDocument();
    });

    it('should handle very long URLs in Request tab', async () => {
      // Arrange
      const user = userEvent.setup();
      const logWithLongUrl = {
        ...mockApiLog,
        url: '/api/pods?namespace=default&filter=running&sort=name&limit=100&offset=0&include=metadata',
      };
      render(<DebugDetailView selectedLog={logWithLongUrl} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      expect(screen.getByText(/namespace=default/)).toBeInTheDocument();
    });

    it('should handle error status codes', async () => {
      // Arrange
      const user = userEvent.setup();
      const logWithError = {
        ...mockApiLog,
        status: 500,
        responseBody: { error: 'Internal Server Error' },
      };
      render(<DebugDetailView selectedLog={logWithError} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('should handle zero duration', async () => {
      // Arrange
      const user = userEvent.setup();
      const logWithZeroDuration = {
        ...mockApiLog,
        duration: 0,
      };
      render(<DebugDetailView selectedLog={logWithZeroDuration} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      expect(screen.getByText(/0.*ms/i)).toBeInTheDocument();
    });

    it('should handle very large response sizes', async () => {
      // Arrange
      const user = userEvent.setup();
      const logWithLargeSize = {
        ...mockApiLog,
        responseSize: 10485760, // 10 MB
      };
      render(<DebugDetailView selectedLog={logWithLargeSize} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      expect(screen.getByText(/10.*MB/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper button roles for tabs', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const tabs = screen.getAllByRole('button');
      expect(tabs.length).toBeGreaterThanOrEqual(3); // At least 3 tabs
    });

    it('should be keyboard navigable - tab switching with Enter', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      requestTab.focus();
      await user.keyboard('{Enter}');

      // Assert
      expect(requestTab.className).toMatch(/active|selected|bg-cyan|text-cyan/);
    });

    it('should be keyboard navigable - tab switching with Space', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      metadataTab.focus();
      await user.keyboard(' ');

      // Assert
      expect(metadataTab.className).toMatch(/active|selected|bg-cyan|text-cyan/);
    });

    it.skip('should be keyboard navigable - copy button with Enter', async () => {
      // Arrange
      render(<DebugDetailView selectedLog={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');

      // Act
      fireEvent.click(copyButton);

      // Assert
      await waitFor(() => expect(mockWriteText).toHaveBeenCalledTimes(1));
    });

    it('should have aria-selected attribute on active tab', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} activeTab="response" />);

      // Assert
      const responseTab = screen.getByTestId('tab-response');
      expect(responseTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should have aria-selected="false" on inactive tabs', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} activeTab="response" />);

      // Assert
      const requestTab = screen.getByTestId('tab-request');
      const metadataTab = screen.getByTestId('tab-metadata');
      expect(requestTab).toHaveAttribute('aria-selected', 'false');
      expect(metadataTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('visual consistency', () => {
    it('should have consistent styling across all tabs', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const responseTab = screen.getByTestId('tab-response');
      const requestTab = screen.getByTestId('tab-request');
      const metadataTab = screen.getByTestId('tab-metadata');

      // All tabs should have similar base classes
      expect(responseTab.className).toMatch(/px|py|p-/);
      expect(requestTab.className).toMatch(/px|py|p-/);
      expect(metadataTab.className).toMatch(/px|py|p-/);
    });

    it('should have rounded corners on appropriate elements', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const detailView = screen.getByTestId('detail-view');
      expect(detailView.className).toMatch(/rounded/);
    });

    it('should have proper spacing between elements', () => {
      // Act
      render(<DebugDetailView selectedLog={mockApiLog} />);

      // Assert
      const detailView = screen.getByTestId('detail-view');
      expect(detailView.className).toMatch(/gap|space/);
    });
  });
});
