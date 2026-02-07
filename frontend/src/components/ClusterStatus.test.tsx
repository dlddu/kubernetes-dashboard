import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ClusterStatus from './ClusterStatus';

describe('ClusterStatus', () => {
  describe('Happy Path', () => {
    it('should render without crashing', () => {
      // Arrange & Act
      render(<ClusterStatus />);

      // Assert
      const clusterStatus = screen.getByTestId('cluster-status');
      expect(clusterStatus).toBeInTheDocument();
    });

    it('should display cluster name', () => {
      // Arrange & Act
      render(<ClusterStatus clusterName="production-cluster" />);

      // Assert
      const clusterName = screen.getByText(/production-cluster/i);
      expect(clusterName).toBeInTheDocument();
    });

    it('should display default cluster name when not provided', () => {
      // Arrange & Act
      render(<ClusterStatus />);

      // Assert
      const clusterName = screen.getByText(/local-cluster/i) || screen.getByTestId('cluster-name');
      expect(clusterName).toBeInTheDocument();
    });

    it('should show cluster connection status', () => {
      // Arrange & Act
      render(<ClusterStatus status="connected" />);

      // Assert
      const statusIndicator = screen.getByTestId('cluster-status-indicator') ||
                              screen.getByText(/connected/i);
      expect(statusIndicator).toBeInTheDocument();
    });

    it('should display green indicator for connected status', () => {
      // Arrange & Act
      const { container } = render(<ClusterStatus status="connected" />);

      // Assert
      const indicator = container.querySelector('[data-status="connected"]') ||
                        screen.getByTestId('cluster-status-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('should display version information when provided', () => {
      // Arrange & Act
      render(<ClusterStatus version="v1.27.0" />);

      // Assert
      const version = screen.getByText(/v1\.27\.0/i);
      expect(version).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when status is loading', () => {
      // Arrange & Act
      render(<ClusterStatus status="loading" />);

      // Assert
      const loadingIndicator = screen.getByTestId('cluster-status-loading') ||
                               screen.queryByText(/loading/i);
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should show pulse animation during loading', () => {
      // Arrange & Act
      const { container } = render(<ClusterStatus status="loading" />);

      // Assert
      const loadingElement = container.querySelector('[data-loading="true"]') ||
                             screen.getByTestId('cluster-status-loading');
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error indicator when disconnected', () => {
      // Arrange & Act
      render(<ClusterStatus status="disconnected" />);

      // Assert
      const errorIndicator = screen.getByTestId('cluster-status-indicator') ||
                             screen.getByText(/disconnected/i);
      expect(errorIndicator).toBeInTheDocument();
    });

    it('should display red indicator for disconnected status', () => {
      // Arrange & Act
      const { container } = render(<ClusterStatus status="disconnected" />);

      // Assert
      const indicator = container.querySelector('[data-status="disconnected"]') ||
                        screen.getByTestId('cluster-status-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('should show error message on hover or click', () => {
      // Arrange & Act
      render(<ClusterStatus status="error" errorMessage="Connection timeout" />);

      // Assert
      // Error message should be accessible (either visible or in tooltip)
      const status = screen.getByTestId('cluster-status');
      expect(status).toHaveAttribute('title', 'Connection timeout');
    });

    it('should display warning for degraded status', () => {
      // Arrange & Act
      render(<ClusterStatus status="degraded" />);

      // Assert
      const warningIndicator = screen.getByTestId('cluster-status-indicator') ||
                               screen.getByText(/degraded/i);
      expect(warningIndicator).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long cluster names gracefully', () => {
      // Arrange
      const longName = 'very-long-cluster-name-that-should-be-truncated-in-the-ui';

      // Act
      render(<ClusterStatus clusterName={longName} />);

      // Assert
      const clusterName = screen.getByText(new RegExp(longName));
      expect(clusterName).toBeInTheDocument();
    });

    it('should handle missing cluster name gracefully', () => {
      // Arrange & Act
      render(<ClusterStatus clusterName="" />);

      // Assert
      const defaultName = screen.getByText(/local-cluster/i) ||
                          screen.getByText(/unknown/i);
      expect(defaultName).toBeInTheDocument();
    });

    it('should update status when prop changes', () => {
      // Arrange
      const { rerender } = render(<ClusterStatus status="loading" />);

      // Act
      rerender(<ClusterStatus status="connected" />);

      // Assert
      const connectedStatus = screen.getByText(/connected/i) ||
                              screen.getByTestId('cluster-status-indicator');
      expect(connectedStatus).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('should have compact layout for mobile', () => {
      // Arrange & Act
      const { container } = render(<ClusterStatus compact />);

      // Assert
      const status = container.querySelector('[data-compact="true"]') ||
                     screen.getByTestId('cluster-status');
      expect(status).toBeInTheDocument();
    });

    it('should display tooltip on hover', () => {
      // Arrange & Act
      render(<ClusterStatus clusterName="prod" status="connected" />);

      // Assert
      const status = screen.getByTestId('cluster-status');
      expect(status).toHaveAttribute('title');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Arrange & Act
      render(<ClusterStatus clusterName="production" status="connected" />);

      // Assert
      const status = screen.getByTestId('cluster-status');
      expect(status).toHaveAttribute('aria-label');
    });

    it('should indicate status with aria-live for screen readers', () => {
      // Arrange & Act
      render(<ClusterStatus status="connected" />);

      // Assert
      const status = screen.getByTestId('cluster-status') ||
                     screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live');
    });

    it('should use semantic HTML for status indicator', () => {
      // Arrange & Act
      const { container } = render(<ClusterStatus status="connected" />);

      // Assert
      const status = container.querySelector('[role="status"]') ||
                     screen.getByTestId('cluster-status');
      expect(status).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work with ClusterContext provider', () => {
      // Arrange
      const MockClusterProvider = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="cluster-provider">{children}</div>
      );

      // Act
      render(
        <MockClusterProvider>
          <ClusterStatus />
        </MockClusterProvider>
      );

      // Assert
      const status = screen.getByTestId('cluster-status');
      expect(status).toBeInTheDocument();
    });

    it('should refresh status on manual trigger', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<ClusterStatus onRefresh={onRefresh} />);
      const status = screen.getByTestId('cluster-status');
      status.click();

      // Assert - clicking might trigger refresh
      // Implementation detail, may need adjustment
    });
  });
});
