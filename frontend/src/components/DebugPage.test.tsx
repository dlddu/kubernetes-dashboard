import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DebugPage } from './DebugPage';
import type { ApiLog } from '../contexts/DebugContext';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

// Mock DebugContext
vi.mock('../contexts/DebugContext', () => ({
  useDebugContext: vi.fn(),
}));

// Mock DebugDetailView
vi.mock('./DebugDetailView', () => ({
  DebugDetailView: ({ entry }: { entry: ApiLog | null }) => (
    <div data-testid="debug-detail-view">{entry ? entry.url : 'no entry'}</div>
  ),
}));

import { useNavigate } from 'react-router-dom';
import { useDebugContext } from '../contexts/DebugContext';

describe('DebugPage - Back Button', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  const setupWithLogs = (logs: ApiLog[] = []) => {
    vi.mocked(useDebugContext).mockReturnValue({
      logs,
      isDebugMode: true,
      toggleDebugMode: vi.fn(),
      clearLogs: vi.fn(),
    } as ReturnType<typeof useDebugContext>);
  };

  describe('rendering', () => {
    it('should render the back button', () => {
      setupWithLogs();
      render(<DebugPage />);

      const backButton = screen.getByTestId('debug-back-button');
      expect(backButton).toBeInTheDocument();
    });

    it('should render back button as a button element', () => {
      setupWithLogs();
      render(<DebugPage />);

      const backButton = screen.getByTestId('debug-back-button');
      expect(backButton.tagName).toBe('BUTTON');
    });

    it('should display "Back" text', () => {
      setupWithLogs();
      render(<DebugPage />);

      const backButton = screen.getByTestId('debug-back-button');
      expect(backButton).toHaveTextContent('Back');
    });

    it('should display a chevron icon', () => {
      setupWithLogs();
      render(<DebugPage />);

      const backButton = screen.getByTestId('debug-back-button');
      const svg = backButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render alongside the page title', () => {
      setupWithLogs();
      render(<DebugPage />);

      const backButton = screen.getByTestId('debug-back-button');
      const title = screen.getByTestId('debug-page-title');
      expect(backButton.parentElement).toBe(title.parentElement);
    });
  });

  describe('navigation', () => {
    it('should call navigate(-1) when clicked', () => {
      setupWithLogs();
      render(<DebugPage />);

      const backButton = screen.getByTestId('debug-back-button');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('should not navigate on render', () => {
      setupWithLogs();
      render(<DebugPage />);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should call navigate each time the button is clicked', () => {
      setupWithLogs();
      render(<DebugPage />);

      const backButton = screen.getByTestId('debug-back-button');
      fireEvent.click(backButton);
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledTimes(2);
    });
  });
});
