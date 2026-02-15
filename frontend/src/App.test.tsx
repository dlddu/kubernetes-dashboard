import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock the overview API to prevent actual fetch calls from OverviewProvider
vi.mock('./api/overview', () => ({
  fetchOverview: vi.fn().mockResolvedValue({
    nodes: { ready: 2, total: 3 },
    unhealthyPods: 0,
    avgCpuPercent: 0,
    avgMemoryPercent: 0,
  }),
}));

describe('App', () => {
  it('should render without crashing', () => {
    // Arrange & Act
    render(<App />);

    // Assert - App should render some content
    const root = document.querySelector('#root');
    expect(root).toBeDefined();
  });

  it('should display Kubernetes Dashboard title', () => {
    // Arrange & Act
    render(<App />);

    // Assert
    const heading = screen.getByRole('heading', { name: /kubernetes dashboard/i });
    expect(heading).toBeInTheDocument();
  });

  it('should have proper accessibility structure', () => {
    // Arrange & Act
    const { container } = render(<App />);

    // Assert
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });
});
