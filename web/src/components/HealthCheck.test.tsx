import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HealthCheck from './HealthCheck';
import * as api from '../services/api';

// Mock the API service
vi.mock('../services/api');

describe('HealthCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render health check component', () => {
    // Act
    render(<HealthCheck />);

    // Assert
    const component = screen.getByTestId('health-check');
    expect(component).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    // Arrange
    vi.spyOn(api, 'checkHealth').mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    // Act
    render(<HealthCheck />);

    // Assert
    const loadingElement = screen.getByText(/checking/i);
    expect(loadingElement).toBeInTheDocument();
  });

  it('should display healthy status when API returns success', async () => {
    // Arrange
    vi.spyOn(api, 'checkHealth').mockResolvedValue({
      status: 'healthy',
    });

    // Act
    render(<HealthCheck />);

    // Assert
    await waitFor(() => {
      const statusElement = screen.getByText(/healthy/i);
      expect(statusElement).toBeInTheDocument();
    });
  });

  it('should display error message when API call fails', async () => {
    // Arrange
    vi.spyOn(api, 'checkHealth').mockRejectedValue(
      new Error('API Error')
    );

    // Act
    render(<HealthCheck />);

    // Assert
    await waitFor(() => {
      const errorElement = screen.getByText(/error/i);
      expect(errorElement).toBeInTheDocument();
    });
  });

  it('should allow retrying health check on failure', async () => {
    // Arrange
    const checkHealthSpy = vi
      .spyOn(api, 'checkHealth')
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce({ status: 'healthy' });

    const user = userEvent.setup();

    // Act
    render(<HealthCheck />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    // Assert
    await waitFor(() => {
      const statusElement = screen.getByText(/healthy/i);
      expect(statusElement).toBeInTheDocument();
    });

    expect(checkHealthSpy).toHaveBeenCalledTimes(2);
  });

  it('should call health check API on component mount', () => {
    // Arrange
    const checkHealthSpy = vi
      .spyOn(api, 'checkHealth')
      .mockResolvedValue({ status: 'healthy' });

    // Act
    render(<HealthCheck />);

    // Assert
    expect(checkHealthSpy).toHaveBeenCalledTimes(1);
  });

  it('should display timestamp when available', async () => {
    // Arrange
    const timestamp = '2026-02-06T00:00:00Z';
    vi.spyOn(api, 'checkHealth').mockResolvedValue({
      status: 'healthy',
      timestamp,
    });

    // Act
    render(<HealthCheck />);

    // Assert
    await waitFor(() => {
      const timestampElement = screen.getByText(new RegExp(timestamp));
      expect(timestampElement).toBeInTheDocument();
    });
  });
});
