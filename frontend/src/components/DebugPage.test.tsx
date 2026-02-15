import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DebugPage } from './DebugPage';
import { DebugProvider, ApiLog } from '../contexts/DebugContext';

// Create a mock clipboard for testing
const clipboardMock = {
  writeText: vi.fn(() => Promise.resolve()),
  readText: vi.fn(() => Promise.resolve('')),
};

// Helper to render component with context
function renderDebugPage(logs: Array<ApiLog> = [], isDebugMode = true) {

  // We need to mock the DebugContext to provide test data
  // Since we can't easily mock the context, we'll use localStorage to set up initial state
  if (logs.length > 0) {
    localStorage.setItem('debug-logs', JSON.stringify(logs));
  }
  if (isDebugMode) {
    localStorage.setItem('debug-mode', 'true');
  }

  return render(
    <DebugProvider>
      <DebugPage clipboard={clipboardMock} />
    </DebugProvider>
  );
}

describe('DebugPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reset clipboard mock to resolved state
    clipboardMock.writeText.mockClear();
    clipboardMock.writeText.mockResolvedValue(undefined);
    clipboardMock.readText.mockClear();
    clipboardMock.readText.mockResolvedValue('');
  });

  describe('Empty states', () => {
    it('should show empty state when no logs and debug mode disabled', () => {
      renderDebugPage([], false);
      expect(screen.getByTestId('debug-empty-state')).toBeInTheDocument();
      expect(screen.getByText('No API calls logged')).toBeInTheDocument();
    });

    it('should show empty state when no logs exist', () => {
      renderDebugPage([], true);
      expect(screen.getByTestId('debug-empty-state')).toBeInTheDocument();
      expect(screen.getByText('No logs yet')).toBeInTheDocument();
    });
  });

  describe('API logs display', () => {
    const mockLogs = [
      {
        method: 'GET',
        url: '/api/v1/namespaces',
        status: 200,
        timestamp: Date.now(),
        duration: 150,
        responseBody: { items: [] },
        responseSize: 1024,
      },
      {
        method: 'POST',
        url: '/api/v1/pods',
        params: { namespace: 'default' },
        status: 201,
        timestamp: Date.now(),
        duration: 200,
        responseBody: { success: true },
        responseSize: 512,
      },
    ];

    it('should render endpoint list with logs', () => {
      renderDebugPage(mockLogs);
      expect(screen.getByTestId('debug-left-panel')).toBeInTheDocument();
      expect(screen.getAllByTestId('endpoint-item')).toHaveLength(2);
    });

    it('should display correct method and status for each log', () => {
      renderDebugPage(mockLogs);
      expect(screen.getByText('GET')).toBeInTheDocument();
      expect(screen.getByText('POST')).toBeInTheDocument();
      const statusCodes = screen.getAllByTestId('status-code');
      expect(statusCodes[0]).toHaveTextContent('200');
      expect(statusCodes[1]).toHaveTextContent('201');
    });

    it('should show placeholder when no endpoint selected', () => {
      renderDebugPage(mockLogs);
      expect(screen.getByText('Select an endpoint to view details')).toBeInTheDocument();
    });

    it('should display response body when endpoint selected', async () => {
      const user = userEvent.setup();
      renderDebugPage(mockLogs);

      const firstEndpoint = screen.getAllByTestId('endpoint-item')[0];
      await user.click(firstEndpoint);

      await waitFor(() => {
        expect(screen.getByText(/"items"/)).toBeInTheDocument();
      });
    });
  });

  describe('Tab navigation', () => {
    const mockLog = [
      {
        method: 'GET',
        url: '/api/v1/pods',
        params: { limit: 10 },
        status: 200,
        timestamp: 1234567890000,
        duration: 125,
        responseBody: { items: [{ name: 'pod-1' }] },
        responseSize: 2048,
      },
    ];

    it('should switch to request tab and show request details', async () => {
      const user = userEvent.setup();
      renderDebugPage(mockLog);

      // Select endpoint first
      await user.click(screen.getByTestId('endpoint-item'));

      // Click Request tab
      const requestTab = screen.getByRole('tab', { name: /request/i });
      await user.click(requestTab);

      await waitFor(() => {
        expect(screen.getByText('Method')).toBeInTheDocument();
        expect(screen.getByText('URL')).toBeInTheDocument();
        expect(screen.getByText('Params')).toBeInTheDocument();
      });
    });

    it('should switch to metadata tab and show metadata', async () => {
      const user = userEvent.setup();
      renderDebugPage(mockLog);

      // Select endpoint first
      await user.click(screen.getByTestId('endpoint-item'));

      // Click Metadata tab
      const metadataTab = screen.getByTestId('metadata-tab');
      await user.click(metadataTab);

      await waitFor(() => {
        expect(screen.getByTestId('metadata-content')).toBeInTheDocument();
        expect(screen.getByTestId('request-timestamp')).toBeInTheDocument();
        expect(screen.getByTestId('request-duration')).toBeInTheDocument();
      });
    });
  });

  describe('Clipboard copy functionality', () => {
    const mockLog = [
      {
        method: 'GET',
        url: '/api/v1/namespaces',
        status: 200,
        timestamp: Date.now(),
        duration: 100,
        responseBody: { items: [{ name: 'default' }] },
        responseSize: 512,
      },
    ];

    // Additional cleanup for clipboard tests
    beforeEach(() => {
      clipboardMock.writeText.mockClear();
      clipboardMock.writeText.mockResolvedValue(undefined);
    });

    it('should render copy button', async () => {
      const user = userEvent.setup();
      renderDebugPage(mockLog);

      // Select an endpoint to show details
      await user.click(screen.getByTestId('endpoint-item'));

      // Copy button should be visible
      const copyButton = screen.getByTestId('copy-response-button');
      expect(copyButton).toBeInTheDocument();
    });

    it('should copy response body to clipboard when copy button clicked', async () => {
      const user = userEvent.setup();
      renderDebugPage(mockLog);

      // Select an endpoint
      await user.click(screen.getByTestId('endpoint-item'));

      // Click copy button
      const copyButton = screen.getByTestId('copy-response-button');
      await user.click(copyButton);

      // Verify clipboard API was called with correct content
      await waitFor(() => {
        expect(clipboardMock.writeText).toHaveBeenCalledWith(
          JSON.stringify(mockLog[0].responseBody, null, 2)
        );
      });
    });

    it('should show "Copied!" feedback after successful copy', async () => {
      const user = userEvent.setup();
      renderDebugPage(mockLog);

      await user.click(screen.getByTestId('endpoint-item'));
      const copyButton = screen.getByTestId('copy-response-button');
      await user.click(copyButton);

      // Should show "Copied!" text
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it.skip('should hide "Copied!" feedback after 1.5 seconds', async () => {
      vi.useFakeTimers();
      try {
        const user = userEvent.setup({ delay: null });

        renderDebugPage(mockLog);

        await user.click(screen.getByTestId('endpoint-item'));
        const copyButton = screen.getByTestId('copy-response-button');
        await user.click(copyButton);

        // Should show "Copied!" immediately
        await waitFor(() => {
          expect(screen.getByText('Copied!')).toBeInTheDocument();
        });

        // Fast forward 1.5 seconds and run all pending timers
        await vi.advanceTimersByTimeAsync(1500);

        // Should hide "Copied!" after timeout
        await waitFor(() => {
          expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
        });
      } finally {
        vi.useRealTimers();
      }
    });

    it.skip('should copy request content when on request tab', async () => {
      const user = userEvent.setup();
      renderDebugPage(mockLog);

      await user.click(screen.getByTestId('endpoint-item'));

      // Switch to request tab
      const requestTab = screen.getByRole('tab', { name: /request/i });
      await user.click(requestTab);

      // Click copy button
      const copyButton = screen.getByTestId('copy-response-button');
      await user.click(copyButton);

      // Should copy request data in the format: "Method: GET\nURL: /api/v1/namespaces"
      await waitFor(() => {
        expect(clipboardMock.writeText).toHaveBeenCalledWith(
          `Method: ${mockLog[0].method}\nURL: ${mockLog[0].url}`
        );
      });
    });

    it.skip('should copy metadata when on metadata tab', async () => {
      const user = userEvent.setup();
      renderDebugPage(mockLog);

      await user.click(screen.getByTestId('endpoint-item'));

      // Switch to metadata tab
      const metadataTab = screen.getByTestId('metadata-tab');
      await user.click(metadataTab);

      // Click copy button
      const copyButton = screen.getByTestId('copy-response-button');
      await user.click(copyButton);

      // Should copy metadata in the format: "Status: 200\nTimestamp: ...\nDuration: 100 ms\nResponse Size: 512 bytes"
      await waitFor(() => {
        expect(clipboardMock.writeText).toHaveBeenCalled();
        const copiedContent = clipboardMock.writeText.mock.calls[0][0] as string;
        expect(copiedContent).toContain('Status: 200');
        expect(copiedContent).toContain('Duration: 100 ms');
        expect(copiedContent).toContain('Response Size: 512 bytes');
      });
    });

    it.skip('should handle clipboard API failure gracefully', async () => {
      clipboardMock.writeText.mockRejectedValueOnce(new Error('Clipboard access denied'));

      const user = userEvent.setup();
      renderDebugPage(mockLog);

      await user.click(screen.getByTestId('endpoint-item'));
      const copyButton = screen.getByTestId('copy-response-button');

      await user.click(copyButton);

      expect(copyButton).toBeInTheDocument();
    });
  });
});
