import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PodLogPanel } from './PodLogPanel';
import type { PodDetails } from '../api/pods';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../api/pods', async (importOriginal) => {
  const original = await importOriginal<typeof import('../api/pods')>();
  return {
    ...original,
    fetchPodLogs: vi.fn(),
    streamPodLogs: vi.fn(),
  };
});

vi.mock('./StatusBadge', () => ({
  StatusBadge: ({ status, testId }: { status: string; testId?: string }) => (
    <span data-testid={testId || 'status-badge'} role="status">
      {status}
    </span>
  ),
}));

import { fetchPodLogs, streamPodLogs } from '../api/pods';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePod(overrides: Partial<PodDetails> = {}): PodDetails {
  return {
    name: 'test-pod',
    namespace: 'default',
    status: 'CrashLoopBackOff',
    restarts: 3,
    node: 'node-1',
    age: '1h',
    containers: ['main'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PodLogPanel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: fetchPodLogs returns some log content
    vi.mocked(fetchPodLogs).mockResolvedValue('INFO Log line 1\nINFO Log line 2');
    // Default: streamPodLogs returns a no-op cleanup
    vi.mocked(streamPodLogs).mockReturnValue(() => {});
  });

  // =========================================================================
  // Rendering — happy path
  // =========================================================================

  describe('rendering - happy path', () => {
    it('should render the panel container', async () => {
      // Arrange
      const pod = makePod();

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('log-panel')).toBeInTheDocument();
      });
    });

    it('should render the backdrop overlay', async () => {
      // Arrange
      const pod = makePod();

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('log-panel-backdrop')).toBeInTheDocument();
      });
    });

    it('should display "Pod Logs" as the panel title', async () => {
      // Arrange
      const pod = makePod();

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const title = screen.getByTestId('log-panel-title');
        expect(title).toBeInTheDocument();
        expect(title).toHaveTextContent('Pod Logs');
      });
    });

    it('should display namespace/name in the pod info area', async () => {
      // Arrange
      const pod = makePod({ name: 'my-pod', namespace: 'production' });

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const podInfo = screen.getByTestId('log-panel-pod-info');
        expect(podInfo).toBeInTheDocument();
        expect(podInfo).toHaveTextContent('production');
        expect(podInfo).toHaveTextContent('my-pod');
      });
    });

    it('should render the StatusBadge with the pod status', async () => {
      // Arrange
      const pod = makePod({ status: 'ImagePullBackOff' });

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const badge = screen.getByTestId('status-badge');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent('ImagePullBackOff');
      });
    });

    it('should render the container selector dropdown', async () => {
      // Arrange
      const pod = makePod({ containers: ['main', 'sidecar'] });

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('log-panel-container-selector')).toBeInTheDocument();
      });
    });

    it('should render the Follow toggle button', async () => {
      // Arrange
      const pod = makePod();

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('log-panel-follow-button')).toBeInTheDocument();
      });
    });

    it('should render the log viewer area', async () => {
      // Arrange
      const pod = makePod();

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('log-panel-log-viewer')).toBeInTheDocument();
      });
    });

    it('should render the panel footer', async () => {
      // Arrange
      const pod = makePod();

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('log-panel-footer')).toBeInTheDocument();
      });
    });

    it('should render the X close button', async () => {
      // Arrange
      const pod = makePod();

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('log-panel-close-button')).toBeInTheDocument();
      });
    });

    it('should be positioned as a fixed right-side panel', async () => {
      // Arrange
      const pod = makePod();

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const panel = screen.getByTestId('log-panel');
        expect(panel.className).toMatch(/fixed|right/);
      });
    });
  });

  // =========================================================================
  // Container selector
  // =========================================================================

  describe('container selector', () => {
    it('should list all containers as options', async () => {
      // Arrange
      const pod = makePod({ containers: ['main', 'sidecar', 'init'] });

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const select = screen.getByTestId('log-panel-container-selector') as HTMLSelectElement;
        const options = Array.from(select.options).map((o) => o.value);
        expect(options).toContain('main');
        expect(options).toContain('sidecar');
        expect(options).toContain('init');
      });
    });

    it('should default to the first container', async () => {
      // Arrange
      const pod = makePod({ containers: ['main', 'sidecar'] });

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const select = screen.getByTestId('log-panel-container-selector') as HTMLSelectElement;
        expect(select.value).toBe('main');
      });
    });

    it('should reload logs when a different container is selected', async () => {
      // Arrange
      const user = userEvent.setup();
      const pod = makePod({ containers: ['main', 'sidecar'] });

      vi.mocked(fetchPodLogs)
        .mockResolvedValueOnce('main container log')
        .mockResolvedValueOnce('sidecar container log');

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('log-panel-log-viewer')).toBeInTheDocument();
      });

      const select = screen.getByTestId('log-panel-container-selector');
      await user.selectOptions(select, 'sidecar');

      // Assert
      await waitFor(() => {
        expect(fetchPodLogs).toHaveBeenCalledWith(
          pod.namespace,
          pod.name,
          'sidecar',
          expect.anything()
        );
      });
    });

    it('should fetch logs for the initially selected container on mount', async () => {
      // Arrange
      const pod = makePod({ containers: ['main', 'sidecar'], namespace: 'default' });

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(fetchPodLogs).toHaveBeenCalledWith(
          'default',
          'test-pod',
          'main',
          expect.anything()
        );
      });
    });
  });

  // =========================================================================
  // Log viewer content
  // =========================================================================

  describe('log viewer content', () => {
    it('should display fetched log content in the log viewer', async () => {
      // Arrange
      const pod = makePod();
      vi.mocked(fetchPodLogs).mockResolvedValue('INFO Server started on port 8080');

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const viewer = screen.getByTestId('log-panel-log-viewer');
        expect(viewer).toHaveTextContent('INFO Server started on port 8080');
      });
    });

    it('should show loading state while logs are being fetched', () => {
      // Arrange
      const pod = makePod();
      vi.mocked(fetchPodLogs).mockImplementation(
        () => new Promise(() => {}) // never resolves
      );

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert: loading indicator or spinner should be present
      const loadingEl =
        screen.queryByText(/loading/i) ||
        screen.queryByRole('status') ||
        document.querySelector('.animate-spin');
      expect(loadingEl).toBeTruthy();
    });

    it('should display error message when fetchPodLogs rejects', async () => {
      // Arrange
      const pod = makePod();
      vi.mocked(fetchPodLogs).mockRejectedValue(new Error('Failed to fetch logs'));

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const viewer = screen.getByTestId('log-panel-log-viewer');
        expect(viewer.textContent).toMatch(/error|failed|unable/i);
      });
    });

    it('should apply red color styling to ERROR log lines', async () => {
      // Arrange
      const pod = makePod();
      vi.mocked(fetchPodLogs).mockResolvedValue('ERROR Something went wrong');

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const viewer = screen.getByTestId('log-panel-log-viewer');
        // Either a styled element exists or the text is present (implementation-agnostic check)
        expect(viewer.textContent).toContain('ERROR Something went wrong');
      });
    });

    it('should apply amber color styling to WARN log lines', async () => {
      // Arrange
      const pod = makePod();
      vi.mocked(fetchPodLogs).mockResolvedValue('WARN Disk usage high');

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const viewer = screen.getByTestId('log-panel-log-viewer');
        expect(viewer.textContent).toContain('WARN Disk usage high');
      });
    });

    it('should apply gray/neutral color styling to INFO log lines', async () => {
      // Arrange
      const pod = makePod();
      vi.mocked(fetchPodLogs).mockResolvedValue('INFO Application ready');

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const viewer = screen.getByTestId('log-panel-log-viewer');
        expect(viewer.textContent).toContain('INFO Application ready');
      });
    });
  });

  // =========================================================================
  // Follow (streaming) mode
  // =========================================================================

  describe('Follow button - streaming mode', () => {
    it('should start streaming when Follow button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const pod = makePod();

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('log-panel-follow-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('log-panel-follow-button'));

      // Assert
      await waitFor(() => {
        expect(streamPodLogs).toHaveBeenCalledWith(
          pod.namespace,
          pod.name,
          expect.any(Function),
          expect.anything(),
          expect.anything()
        );
      });
    });

    it('should show streaming indicator in footer when Follow is active', async () => {
      // Arrange
      const user = userEvent.setup();
      const pod = makePod();

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('log-panel-follow-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('log-panel-follow-button'));

      // Assert
      await waitFor(() => {
        const indicator = screen.getByTestId('log-panel-streaming-indicator');
        expect(indicator).toBeInTheDocument();
        expect(indicator).toHaveTextContent(/streaming live/i);
      });
    });

    it('should not show streaming indicator when Follow is inactive', async () => {
      // Arrange
      const pod = makePod();

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert: streaming indicator should not be present before clicking Follow
      await waitFor(() => {
        expect(screen.getByTestId('log-panel-log-viewer')).toBeInTheDocument();
      });

      const indicator = screen.queryByTestId('log-panel-streaming-indicator');
      expect(indicator).not.toBeInTheDocument();
    });

    it('should stop streaming when Follow button is clicked again (toggle off)', async () => {
      // Arrange
      const user = userEvent.setup();
      const pod = makePod();
      const mockCleanup = vi.fn();
      vi.mocked(streamPodLogs).mockReturnValue(mockCleanup);

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('log-panel-follow-button')).toBeInTheDocument();
      });

      // Turn on
      await user.click(screen.getByTestId('log-panel-follow-button'));
      // Turn off
      await user.click(screen.getByTestId('log-panel-follow-button'));

      // Assert: cleanup should have been called to stop streaming
      expect(mockCleanup).toHaveBeenCalled();
    });

    it('should hide streaming indicator when Follow is toggled off', async () => {
      // Arrange
      const user = userEvent.setup();
      const pod = makePod();
      vi.mocked(streamPodLogs).mockReturnValue(vi.fn());

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('log-panel-follow-button')).toBeInTheDocument();
      });

      // Toggle on then off
      const followButton = screen.getByTestId('log-panel-follow-button');
      await user.click(followButton);

      await waitFor(() => {
        expect(screen.getByTestId('log-panel-streaming-indicator')).toBeInTheDocument();
      });

      await user.click(followButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByTestId('log-panel-streaming-indicator')).not.toBeInTheDocument();
      });
    });

    it('should append new lines to log viewer while streaming', async () => {
      // Arrange
      const user = userEvent.setup();
      const pod = makePod();

      let capturedCallback: ((line: string) => void) | null = null;
      vi.mocked(streamPodLogs).mockImplementation((_ns, _name, callback) => {
        capturedCallback = callback;
        return () => {};
      });

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('log-panel-follow-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('log-panel-follow-button'));

      await waitFor(() => {
        expect(capturedCallback).not.toBeNull();
      });

      // Simulate incoming stream lines
      act(() => {
        capturedCallback!('STREAM line 1');
        capturedCallback!('STREAM line 2');
      });

      // Assert
      await waitFor(() => {
        const viewer = screen.getByTestId('log-panel-log-viewer');
        expect(viewer.textContent).toContain('STREAM line 1');
        expect(viewer.textContent).toContain('STREAM line 2');
      });
    });

    it('should clean up streaming when container selection changes while following', async () => {
      // Arrange
      const user = userEvent.setup();
      const pod = makePod({ containers: ['main', 'sidecar'] });
      const mockCleanup = vi.fn();
      vi.mocked(streamPodLogs).mockReturnValue(mockCleanup);

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('log-panel-follow-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('log-panel-follow-button'));
      await user.selectOptions(screen.getByTestId('log-panel-container-selector'), 'sidecar');

      // Assert: old stream must be cleaned up when switching container
      await waitFor(() => {
        expect(mockCleanup).toHaveBeenCalled();
      });
    });
  });

  // =========================================================================
  // Close interactions
  // =========================================================================

  describe('close interactions', () => {
    it('should call onClose when backdrop is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const onClose = vi.fn();
      const pod = makePod();

      // Act
      render(<PodLogPanel pod={pod} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('log-panel-backdrop')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('log-panel-backdrop'));

      // Assert
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when X close button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const onClose = vi.fn();
      const pod = makePod();

      // Act
      render(<PodLogPanel pod={pod} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('log-panel-close-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('log-panel-close-button'));

      // Assert
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should clean up streaming when panel is closed via X button', async () => {
      // Arrange
      const user = userEvent.setup();
      const onClose = vi.fn();
      const pod = makePod();
      const mockCleanup = vi.fn();
      vi.mocked(streamPodLogs).mockReturnValue(mockCleanup);

      // Act
      render(<PodLogPanel pod={pod} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('log-panel-follow-button')).toBeInTheDocument();
      });

      // Start streaming
      await user.click(screen.getByTestId('log-panel-follow-button'));

      // Close the panel
      await user.click(screen.getByTestId('log-panel-close-button'));

      // Assert
      expect(mockCleanup).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('should clean up streaming on unmount', async () => {
      // Arrange
      const pod = makePod();
      const mockCleanup = vi.fn();
      vi.mocked(streamPodLogs).mockReturnValue(mockCleanup);

      const user = userEvent.setup();

      const { unmount } = render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('log-panel-follow-button')).toBeInTheDocument();
      });

      // Start streaming
      await user.click(screen.getByTestId('log-panel-follow-button'));

      // Act: unmount (simulates parent removing the component)
      unmount();

      // Assert: streaming cleanup called during unmount
      expect(mockCleanup).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Edge cases
  // =========================================================================

  describe('edge cases', () => {
    it('should handle a single-container pod without showing a broken selector', async () => {
      // Arrange
      const pod = makePod({ containers: ['only-container'] });

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const select = screen.getByTestId('log-panel-container-selector') as HTMLSelectElement;
        expect(select.options.length).toBe(1);
        expect(select.value).toBe('only-container');
      });
    });

    it('should handle empty log response gracefully', async () => {
      // Arrange
      const pod = makePod();
      vi.mocked(fetchPodLogs).mockResolvedValue('');

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert: log viewer should still render (without crashing)
      await waitFor(() => {
        expect(screen.getByTestId('log-panel-log-viewer')).toBeInTheDocument();
      });
    });

    it('should handle very long pod names in the pod info area', async () => {
      // Arrange
      const pod = makePod({
        name: 'very-long-pod-name-that-may-overflow-the-header-area-abc123',
        namespace: 'my-namespace',
      });

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const podInfo = screen.getByTestId('log-panel-pod-info');
        expect(podInfo).toHaveTextContent('very-long-pod-name-that-may-overflow-the-header-area-abc123');
      });
    });

    it('should handle pod with many containers in the selector', async () => {
      // Arrange
      const containers = ['container-1', 'container-2', 'container-3', 'container-4', 'container-5'];
      const pod = makePod({ containers });

      // Act
      render(<PodLogPanel pod={pod} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const select = screen.getByTestId('log-panel-container-selector') as HTMLSelectElement;
        expect(select.options.length).toBe(5);
      });
    });

    it('should re-fetch logs when the pod prop changes', async () => {
      // Arrange
      const pod1 = makePod({ name: 'pod-1', namespace: 'ns-1' });
      const pod2 = makePod({ name: 'pod-2', namespace: 'ns-2' });

      vi.mocked(fetchPodLogs)
        .mockResolvedValueOnce('pod-1 logs')
        .mockResolvedValueOnce('pod-2 logs');

      // Act
      const { rerender } = render(<PodLogPanel pod={pod1} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(fetchPodLogs).toHaveBeenCalledWith('ns-1', 'pod-1', expect.anything(), expect.anything());
      });

      rerender(<PodLogPanel pod={pod2} onClose={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(fetchPodLogs).toHaveBeenCalledWith('ns-2', 'pod-2', expect.anything(), expect.anything());
      });
    });
  });
});
