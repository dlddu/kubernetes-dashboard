import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TopBar from './TopBar';

// Mock child components
vi.mock('./NamespaceSelector', () => ({
  default: () => <div data-testid="namespace-selector">NamespaceSelector</div>,
}));

vi.mock('./ClusterStatus', () => ({
  default: () => <div data-testid="cluster-status">ClusterStatus</div>,
}));

describe('TopBar', () => {
  it('should render without crashing', () => {
    // Arrange & Act
    render(<TopBar />);

    // Assert
    const topBar = screen.getByRole('banner') || screen.getByTestId('top-bar');
    expect(topBar).toBeInTheDocument();
  });

  it('should render NamespaceSelector component', () => {
    // Arrange & Act
    render(<TopBar />);

    // Assert
    const namespaceSelector = screen.getByTestId('namespace-selector');
    expect(namespaceSelector).toBeInTheDocument();
  });

  it('should render ClusterStatus component', () => {
    // Arrange & Act
    render(<TopBar />);

    // Assert
    const clusterStatus = screen.getByTestId('cluster-status');
    expect(clusterStatus).toBeInTheDocument();
  });

  it('should have both components visible simultaneously', () => {
    // Arrange & Act
    render(<TopBar />);

    // Assert
    const namespaceSelector = screen.getByTestId('namespace-selector');
    const clusterStatus = screen.getByTestId('cluster-status');

    expect(namespaceSelector).toBeVisible();
    expect(clusterStatus).toBeVisible();
  });

  it('should use semantic HTML banner role', () => {
    // Arrange & Act
    render(<TopBar />);

    // Assert
    const banner = screen.getByRole('banner');
    expect(banner).toBeInTheDocument();
  });

  it('should have proper accessibility structure', () => {
    // Arrange & Act
    const { container } = render(<TopBar />);

    // Assert
    const banner = container.querySelector('[role="banner"]') || container.querySelector('header');
    expect(banner).toBeInTheDocument();
  });
});
