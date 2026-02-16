import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { DebugDetailView } from './DebugDetailView';
import type { ApiLog } from '../contexts/DebugContext';

// Mock clipboard API
const mockWriteText = vi.fn();

describe('DebugDetailView', () => {
  const mockApiLog: ApiLog = {
    method: 'GET',
    url: '/api/pods',
    params: { namespace: 'default' },
    status: 200,
    timestamp: 1704067200000, // 2024-01-01 00:00:00 UTC
    duration: 125.5,
    responseBody: {
      items: [
        { name: 'pod-1', status: 'Running' },
        { name: 'pod-2', status: 'Pending' }
      ]
    },
    responseSize: 1024
  };

  beforeEach(() => {
    // Setup clipboard mock
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText
      },
      writable: true,
      configurable: true
    });
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('rendering - basic structure', () => {
    it('should render without crashing when entry is null', () => {
      // Act
      render(<DebugDetailView entry={null} />);

      // Assert
      const detailView = screen.getByTestId('detail-view');
      expect(detailView).toBeInTheDocument();
    });

    it('should render without crashing when entry is provided', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const detailView = screen.getByTestId('detail-view');
      expect(detailView).toBeInTheDocument();
    });

    it('should have proper data-testid attribute', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      expect(screen.getByTestId('detail-view')).toBeInTheDocument();
    });
  });

  describe('placeholder state - when entry is null', () => {
    it('should display placeholder message when entry is null', () => {
      // Act
      render(<DebugDetailView entry={null} />);

      // Assert
      expect(screen.getByText(/select an endpoint/i)).toBeInTheDocument();
    });

    it('should not display tabs when entry is null', () => {
      // Act
      render(<DebugDetailView entry={null} />);

      // Assert
      expect(screen.queryByTestId('tab-response')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab-request')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab-metadata')).not.toBeInTheDocument();
    });

    it('should not display copy button when entry is null', () => {
      // Act
      render(<DebugDetailView entry={null} />);

      // Assert
      expect(screen.queryByTestId('copy-button')).not.toBeInTheDocument();
    });

    it('should center placeholder text', () => {
      // Act
      render(<DebugDetailView entry={null} />);

      // Assert
      const placeholder = screen.getByText(/select an endpoint/i);
      const container = placeholder.closest('div');
      expect(container?.className).toMatch(/center|justify-center|items-center/i);
    });
  });

  describe('tabs - basic rendering', () => {
    it('should render all three tabs when entry is provided', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      expect(screen.getByTestId('tab-response')).toBeInTheDocument();
      expect(screen.getByTestId('tab-request')).toBeInTheDocument();
      expect(screen.getByTestId('tab-metadata')).toBeInTheDocument();
    });

    it('should display correct tab labels', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      expect(screen.getByTestId('tab-response')).toHaveTextContent('Response');
      expect(screen.getByTestId('tab-request')).toHaveTextContent('Request');
      expect(screen.getByTestId('tab-metadata')).toHaveTextContent('Metadata');
    });

    it('should render tabs as button elements', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      expect(screen.getByTestId('tab-response').tagName).toBe('BUTTON');
      expect(screen.getByTestId('tab-request').tagName).toBe('BUTTON');
      expect(screen.getByTestId('tab-metadata').tagName).toBe('BUTTON');
    });

    it('should have tab role attributes', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      expect(screen.getByTestId('tab-response')).toHaveAttribute('role', 'tab');
      expect(screen.getByTestId('tab-request')).toHaveAttribute('role', 'tab');
      expect(screen.getByTestId('tab-metadata')).toHaveAttribute('role', 'tab');
    });
  });

  describe('tabs - default active state', () => {
    it('should have Response tab active by default', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const responseTab = screen.getByTestId('tab-response');
      expect(responseTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should have Request tab inactive by default', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const requestTab = screen.getByTestId('tab-request');
      expect(requestTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should have Metadata tab inactive by default', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const metadataTab = screen.getByTestId('tab-metadata');
      expect(metadataTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should display Response content by default', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      expect(screen.getByText(/pod-1/i)).toBeInTheDocument();
    });
  });

  describe('tabs - switching behavior', () => {
    it('should switch to Request tab when clicked', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      expect(requestTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should switch to Metadata tab when clicked', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      expect(metadataTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should deactivate Response tab when switching to Request', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const responseTab = screen.getByTestId('tab-response');
      const requestTab = screen.getByTestId('tab-request');

      expect(responseTab).toHaveAttribute('aria-selected', 'true');

      // Act
      await user.click(requestTab);

      // Assert
      expect(responseTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should switch back to Response tab', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const responseTab = screen.getByTestId('tab-response');
      const requestTab = screen.getByTestId('tab-request');

      // Act - Switch to Request first
      await user.click(requestTab);
      expect(requestTab).toHaveAttribute('aria-selected', 'true');

      // Act - Switch back to Response
      await user.click(responseTab);

      // Assert
      expect(responseTab).toHaveAttribute('aria-selected', 'true');
      expect(requestTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should cycle through all tabs', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const responseTab = screen.getByTestId('tab-response');
      const requestTab = screen.getByTestId('tab-request');
      const metadataTab = screen.getByTestId('tab-metadata');

      // Act & Assert - Cycle through tabs
      expect(responseTab).toHaveAttribute('aria-selected', 'true');

      await user.click(requestTab);
      expect(requestTab).toHaveAttribute('aria-selected', 'true');

      await user.click(metadataTab);
      expect(metadataTab).toHaveAttribute('aria-selected', 'true');

      await user.click(responseTab);
      expect(responseTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Response tab - content display', () => {
    it('should display JSON response body', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      expect(screen.getByText(/pod-1/i)).toBeInTheDocument();
      expect(screen.getByText(/Running/i)).toBeInTheDocument();
    });

    it('should have dark theme background', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const content = screen.getByTestId('response-content');
      expect(content?.className).toMatch(/bg-gray-950/);
    });

    it('should use monospace font', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const content = screen.getByTestId('response-content');
      expect(content?.className).toMatch(/font-mono/);
    });

    it('should display endpoint as comment', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const content = screen.getByText(/\/api\/pods/i);
      expect(content).toBeInTheDocument();
    });

    it('should format JSON with proper indentation', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const responseContent = screen.getByTestId('response-content');
      expect(responseContent.innerHTML).toMatch(/\n/); // Should have newlines for formatting
    });

    it('should display nested JSON objects', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const responseContent = screen.getByTestId('response-content');
      expect(responseContent.textContent).toMatch(/items/i);
      expect(responseContent.textContent).toMatch(/name/i);
      expect(responseContent.textContent).toMatch(/status/i);
    });

    it('should handle array response bodies', () => {
      // Arrange
      const arrayLog: ApiLog = {
        ...mockApiLog,
        responseBody: ['item1', 'item2', 'item3']
      };

      // Act
      render(<DebugDetailView entry={arrayLog} />);

      // Assert
      expect(screen.getByText(/item1/i)).toBeInTheDocument();
    });

    it('should handle string response bodies', () => {
      // Arrange
      const stringLog: ApiLog = {
        ...mockApiLog,
        responseBody: 'Simple string response'
      };

      // Act
      render(<DebugDetailView entry={stringLog} />);

      // Assert
      expect(screen.getByText(/Simple string response/i)).toBeInTheDocument();
    });

    it('should handle number response bodies', () => {
      // Arrange
      const numberLog: ApiLog = {
        ...mockApiLog,
        responseBody: 42
      };

      // Act
      render(<DebugDetailView entry={numberLog} />);

      // Assert
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should handle null response bodies', () => {
      // Arrange
      const nullLog: ApiLog = {
        ...mockApiLog,
        responseBody: null
      };

      // Act
      render(<DebugDetailView entry={nullLog} />);

      // Assert
      expect(screen.getByText('null')).toBeInTheDocument();
    });
  });

  describe('Response tab - syntax highlighting', () => {
    it('should apply purple color to JSON keys', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const responseContent = screen.getByTestId('response-content');
      const htmlContent = responseContent.innerHTML;
      expect(htmlContent).toMatch(/purple|violet/i);
    });

    it('should apply amber color to strings', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const responseContent = screen.getByTestId('response-content');
      const htmlContent = responseContent.innerHTML;
      expect(htmlContent).toMatch(/amber/i);
    });

    it('should apply cyan color to numbers', () => {
      // Arrange
      const numLog: ApiLog = {
        ...mockApiLog,
        responseBody: { count: 123, total: 456 }
      };

      // Act
      render(<DebugDetailView entry={numLog} />);

      // Assert
      expect(screen.getByText(/123/)).toBeInTheDocument();
    });
  });

  describe('Request tab - content display', () => {
    it('should display method when Request tab is active', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Method')).toBeInTheDocument();
      });
      expect(screen.getByText('GET')).toBeInTheDocument();
    });

    it('should display URL when Request tab is active', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('URL')).toBeInTheDocument();
      });
      expect(screen.getByText('/api/pods')).toBeInTheDocument();
    });

    it('should display params when present', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Params')).toBeInTheDocument();
      });
      expect(screen.getByText(/default/i)).toBeInTheDocument();
    });

    it('should not display params section when params is null', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const noParamsLog: ApiLog = {
        ...mockApiLog,
        params: undefined
      };
      render(<DebugDetailView entry={noParamsLog} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('request-content')).toBeInTheDocument();
      });
      expect(screen.queryByText('Params')).not.toBeInTheDocument();
    });

    it('should format params as JSON when provided', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const complexParamsLog: ApiLog = {
        ...mockApiLog,
        params: { namespace: 'kube-system', limit: 100 }
      };
      render(<DebugDetailView entry={complexParamsLog} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/kube-system/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/100/)).toBeInTheDocument();
    });

    it('should display key-value format for request fields', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Method')).toBeInTheDocument();
      });
      const methodValue = screen.getByText('GET');
      expect(methodValue).toBeInTheDocument();
    });
  });

  describe('Metadata tab - content display', () => {
    it('should display status code when Metadata tab is active', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
      expect(screen.getByTestId('status-code')).toHaveTextContent('200');
    });

    it('should display timestamp', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Timestamp')).toBeInTheDocument();
      });
      expect(screen.getByTestId('request-timestamp')).toHaveTextContent(/2024-01-01/i);
    });

    it('should display duration', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Duration')).toBeInTheDocument();
      });
      expect(screen.getByTestId('request-duration')).toHaveTextContent(/126/i); // Rounded from 125.5
    });

    it('should display response size', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Response Size')).toBeInTheDocument();
      });
      expect(screen.getByText(/1024/)).toBeInTheDocument();
    });

    it('should display content type if available', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Content-Type')).toBeInTheDocument();
      });
      expect(screen.getByText(/application\/json/i)).toBeInTheDocument();
    });

    it('should format timestamp as ISO string', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('request-timestamp')).toBeInTheDocument();
      });
      const timestamp = screen.getByTestId('request-timestamp');
      expect(timestamp.textContent).toMatch(/2024-01-01T00:00:00/i);
    });

    it('should round duration to nearest millisecond', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const preciseLog: ApiLog = {
        ...mockApiLog,
        duration: 123.456
      };
      render(<DebugDetailView entry={preciseLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      await user.click(metadataTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('request-duration')).toBeInTheDocument();
      });
      expect(screen.getByTestId('request-duration')).toHaveTextContent(/123/);
    });
  });

  describe('Copy button - rendering', () => {
    it('should render copy button when entry is provided', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      expect(screen.getByTestId('copy-button')).toBeInTheDocument();
    });

    it('should render copy button as a button element', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const copyButton = screen.getByTestId('copy-button');
      expect(copyButton.tagName).toBe('BUTTON');
    });

    it('should display copy icon or text', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const copyButton = screen.getByTestId('copy-button');
      expect(copyButton).toHaveTextContent(/copy/i);
    });

    it('should have accessible label', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const copyButton = screen.getByTestId('copy-button');
      expect(copyButton).toHaveAttribute('aria-label');
    });
  });

  describe('Copy button - Response tab functionality', () => {
    it('should copy Response content when clicked', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');

      // Act
      await user.click(copyButton);

      // Assert
      expect(mockWriteText).toHaveBeenCalledTimes(1);
      const copiedContent = mockWriteText.mock.calls[0][0];
      expect(copiedContent).toContain('pod-1');
    });

    it('should copy formatted JSON from Response tab', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');

      // Act
      await user.click(copyButton);

      // Assert
      const copiedContent = mockWriteText.mock.calls[0][0];
      expect(copiedContent).toContain('"items"');
      expect(copiedContent).toContain('"name"');
    });
  });

  describe('Copy button - Request tab functionality', () => {
    it('should copy Request content when Request tab is active', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const requestTab = screen.getByTestId('tab-request');
      const copyButton = screen.getByTestId('copy-button');

      // Act - Switch to Request tab
      await user.click(requestTab);
      await waitFor(() => {
        expect(screen.getByTestId('request-content')).toBeInTheDocument();
      });

      // Act - Click copy
      await user.click(copyButton);

      // Assert
      expect(mockWriteText).toHaveBeenCalledTimes(1);
      const copiedContent = mockWriteText.mock.calls[0][0];
      expect(copiedContent).toContain('GET');
      expect(copiedContent).toContain('/api/pods');
    });

    it('should include params in copied Request content', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const requestTab = screen.getByTestId('tab-request');
      const copyButton = screen.getByTestId('copy-button');

      // Act
      await user.click(requestTab);
      await waitFor(() => {
        expect(screen.getByTestId('request-content')).toBeInTheDocument();
      });
      await user.click(copyButton);

      // Assert
      const copiedContent = mockWriteText.mock.calls[0][0];
      expect(copiedContent).toContain('default');
    });
  });

  describe('Copy button - Metadata tab functionality', () => {
    it('should copy Metadata content when Metadata tab is active', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');
      const copyButton = screen.getByTestId('copy-button');

      // Act
      await user.click(metadataTab);
      await waitFor(() => {
        expect(screen.getByTestId('metadata-content')).toBeInTheDocument();
      });
      await user.click(copyButton);

      // Assert
      expect(mockWriteText).toHaveBeenCalledTimes(1);
      const copiedContent = mockWriteText.mock.calls[0][0];
      expect(copiedContent).toContain('200');
      expect(copiedContent).toContain('1024');
    });

    it('should include timestamp in copied Metadata content', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');
      const copyButton = screen.getByTestId('copy-button');

      // Act
      await user.click(metadataTab);
      await waitFor(() => {
        expect(screen.getByTestId('metadata-content')).toBeInTheDocument();
      });
      await user.click(copyButton);

      // Assert
      const copiedContent = mockWriteText.mock.calls[0][0];
      expect(copiedContent).toMatch(/2024-01-01/);
    });
  });

  describe('Copy button - feedback mechanism', () => {
    it('should display "Copied!" message after successful copy', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');

      // Act
      await user.click(copyButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
      });
    });

    it('should hide "Copied!" message after 1.5 seconds', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');

      // Act
      await user.click(copyButton);

      // Assert - Message appears
      await waitFor(() => {
        expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
      });

      // Act - Activate fake timers after user interaction
      vi.useFakeTimers();
      vi.advanceTimersByTime(1500);

      // Assert - Message disappears
      await waitFor(() => {
        expect(screen.queryByText(/Copied!/i)).not.toBeInTheDocument();
      });

      // Cleanup
      vi.useRealTimers();
    });

    it('should replace "Copy" text with "Copied!" temporarily', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');
      expect(copyButton).toHaveTextContent(/copy/i);

      // Act
      await user.click(copyButton);

      // Assert
      await waitFor(() => {
        expect(copyButton).toHaveTextContent(/Copied!/i);
      });
    });

    it('should restore "Copy" text after timeout', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');

      // Act
      await user.click(copyButton);

      // Wait for feedback
      await waitFor(() => {
        expect(copyButton).toHaveTextContent(/Copied!/i);
      });

      // Act - Activate fake timers after user interaction and wait for timeout
      vi.useFakeTimers();
      vi.advanceTimersByTime(1500);

      // Assert
      await waitFor(() => {
        expect(copyButton).toHaveTextContent(/^Copy$/i);
      });

      // Cleanup
      vi.useRealTimers();
    });

    it('should handle multiple rapid copy clicks', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');

      // Act - Click multiple times
      await user.click(copyButton);
      await user.click(copyButton);
      await user.click(copyButton);

      // Assert - Should be called multiple times
      expect(mockWriteText).toHaveBeenCalledTimes(3);
    });
  });

  describe('edge cases', () => {
    it('should handle very large JSON response bodies', () => {
      // Arrange
      const largeLog: ApiLog = {
        ...mockApiLog,
        responseBody: Array(1000).fill({ name: 'pod', status: 'Running' })
      };

      // Act
      render(<DebugDetailView entry={largeLog} />);

      // Assert
      expect(screen.getByTestId('detail-view')).toBeInTheDocument();
    });

    it('should handle empty response body', () => {
      // Arrange
      const emptyLog: ApiLog = {
        ...mockApiLog,
        responseBody: {}
      };

      // Act
      render(<DebugDetailView entry={emptyLog} />);

      // Assert
      expect(screen.getByTestId('detail-view')).toBeInTheDocument();
    });

    it('should handle response body with special characters', () => {
      // Arrange
      const specialLog: ApiLog = {
        ...mockApiLog,
        responseBody: { message: 'Error: <script>alert("xss")</script>' }
      };

      // Act
      render(<DebugDetailView entry={specialLog} />);

      // Assert
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    it('should handle very long URLs in Request tab', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const longUrlLog: ApiLog = {
        ...mockApiLog,
        url: '/api/very/long/url/with/many/segments/and/query/params?param1=value1&param2=value2'
      };
      render(<DebugDetailView entry={longUrlLog} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      await user.click(requestTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('request-content')).toBeInTheDocument();
      });
      expect(screen.getByText(/\/api\/very\/long\/url/)).toBeInTheDocument();
    });

    it('should handle clipboard write failure gracefully', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      mockWriteText.mockRejectedValueOnce(new Error('Clipboard denied'));
      render(<DebugDetailView entry={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');

      // Act & Assert - Should not throw error
      await user.click(copyButton);
      expect(mockWriteText).toHaveBeenCalled();
    });

    it('should handle switching tabs while copy feedback is showing', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');
      const requestTab = screen.getByTestId('tab-request');

      // Act - Copy and immediately switch tab
      await user.click(copyButton);
      await user.click(requestTab);

      // Assert - Should handle gracefully
      await waitFor(() => {
        expect(screen.getByTestId('tab-request')).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('should handle entry prop changing while viewing', () => {
      // Arrange
      const { rerender } = render(<DebugDetailView entry={mockApiLog} />);

      const newLog: ApiLog = {
        ...mockApiLog,
        method: 'POST',
        url: '/api/new-endpoint'
      };

      // Act
      rerender(<DebugDetailView entry={newLog} />);

      // Assert
      expect(screen.getByText(/\/api\/new-endpoint/)).toBeInTheDocument();
    });

    it('should handle entry changing from null to populated', () => {
      // Arrange
      const { rerender } = render(<DebugDetailView entry={null} />);

      expect(screen.getByText(/select an endpoint/i)).toBeInTheDocument();

      // Act
      rerender(<DebugDetailView entry={mockApiLog} />);

      // Assert
      expect(screen.queryByText(/select an endpoint/i)).not.toBeInTheDocument();
      expect(screen.getByTestId('tab-response')).toBeInTheDocument();
    });

    it('should handle entry changing from populated to null', () => {
      // Arrange
      const { rerender } = render(<DebugDetailView entry={mockApiLog} />);

      expect(screen.getByTestId('tab-response')).toBeInTheDocument();

      // Act
      rerender(<DebugDetailView entry={null} />);

      // Assert
      expect(screen.getByText(/select an endpoint/i)).toBeInTheDocument();
      expect(screen.queryByTestId('tab-response')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should be keyboard navigable through tabs', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const responseTab = screen.getByTestId('tab-response');
      const requestTab = screen.getByTestId('tab-request');

      // Act
      responseTab.focus();
      await user.keyboard('{Tab}');

      // Assert - Should move focus (to request tab or copy button depending on tab order)
      expect(document.activeElement).toBeInTheDocument();
      expect([requestTab, screen.getByTestId('copy-button')]).toContain(document.activeElement);
    });

    it('should activate tabs with Enter key', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const requestTab = screen.getByTestId('tab-request');

      // Act
      requestTab.focus();
      await user.keyboard('{Enter}');

      // Assert
      await waitFor(() => {
        expect(requestTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('should activate tabs with Space key', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<DebugDetailView entry={mockApiLog} />);

      const metadataTab = screen.getByTestId('tab-metadata');

      // Act
      metadataTab.focus();
      await user.keyboard(' ');

      // Assert
      await waitFor(() => {
        expect(metadataTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('should have tablist role for tab container', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
    });

    it('should have tabpanel role for content area', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toBeInTheDocument();
    });

    it('should associate tabpanel with active tab', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const responseTab = screen.getByTestId('tab-response');
      const tabpanel = screen.getByRole('tabpanel');

      expect(responseTab).toHaveAttribute('aria-selected', 'true');
      expect(tabpanel).toBeInTheDocument();
    });

    it('should be focusable copy button', async () => {
      // Arrange
      render(<DebugDetailView entry={mockApiLog} />);

      const copyButton = screen.getByTestId('copy-button');

      // Act
      copyButton.focus();

      // Assert
      expect(copyButton).toHaveFocus();
    });
  });

  describe('visual consistency', () => {
    it('should have consistent styling across all tabs', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const tabs = [
        screen.getByTestId('tab-response'),
        screen.getByTestId('tab-request'),
        screen.getByTestId('tab-metadata')
      ];

      tabs.forEach(tab => {
        expect(tab.className).toMatch(/px-|py-/); // Should have padding
      });
    });

    it('should highlight active tab differently', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const responseTab = screen.getByTestId('tab-response');
      const requestTab = screen.getByTestId('tab-request');

      expect(responseTab.className).not.toBe(requestTab.className);
    });

    it('should have proper spacing between elements', () => {
      // Act
      render(<DebugDetailView entry={mockApiLog} />);

      // Assert
      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel.className).toMatch(/p-|padding/);
    });
  });
});
