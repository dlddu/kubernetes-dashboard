import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

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
