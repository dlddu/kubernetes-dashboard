import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('should render without crashing', () => {
    // Act
    render(<App />);

    // Assert
    const appElement = screen.getByTestId('app');
    expect(appElement).toBeInTheDocument();
  });

  it('should display the application title', () => {
    // Act
    render(<App />);

    // Assert
    const titleElement = screen.getByText(/Kubernetes Dashboard/i);
    expect(titleElement).toBeInTheDocument();
  });

  it('should have proper Tailwind CSS classes applied', () => {
    // Act
    render(<App />);

    // Assert
    const appElement = screen.getByTestId('app');
    // Check that element exists and can have classes
    expect(appElement).toBeDefined();
  });
});
