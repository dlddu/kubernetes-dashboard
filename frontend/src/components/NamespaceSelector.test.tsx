import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import NamespaceSelector from './NamespaceSelector';
import { NamespaceProvider } from '../context/NamespaceContext';

// Mock the namespaces API
vi.mock('../api/namespaces', () => ({
  fetchNamespaces: vi.fn(),
}));

import { fetchNamespaces } from '../api/namespaces';

const mockFetchNamespaces = vi.mocked(fetchNamespaces);

describe('NamespaceSelector', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<NamespaceProvider>{component}</NamespaceProvider>);
  };

  describe('Loading State', () => {
    it('should display loading state initially', async () => {
      // Arrange
      mockFetchNamespaces.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ namespaces: ['default'] }), 1000);
          })
      );

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      expect(screen.getByTestId('namespace-loading')).toBeInTheDocument();
    });

    it('should display skeleton loader while loading', async () => {
      // Arrange
      mockFetchNamespaces.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ namespaces: ['default'] }), 1000);
          })
      );

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      const skeleton = screen.getByTestId('namespace-loading');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });

  describe('Success State', () => {
    it('should display namespace selector after successful fetch', async () => {
      // Arrange
      mockFetchNamespaces.mockResolvedValueOnce({
        namespaces: ['default', 'kube-system'],
      });

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should show "All Namespaces" as default option', async () => {
      // Arrange
      mockFetchNamespaces.mockResolvedValueOnce({
        namespaces: ['default', 'kube-system'],
      });

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('All Namespaces')).toBeInTheDocument();
      });
    });

    it('should display all fetched namespaces in dropdown', async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetchNamespaces.mockResolvedValueOnce({
        namespaces: ['default', 'kube-system', 'kube-public'],
      });

      // Act
      renderWithProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Open dropdown
      await user.click(screen.getByRole('combobox'));

      // Assert - check all options are present
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4); // All Namespaces + 3 namespaces
      expect(screen.getByText('default')).toBeInTheDocument();
      expect(screen.getByText('kube-system')).toBeInTheDocument();
      expect(screen.getByText('kube-public')).toBeInTheDocument();
    });

    it('should allow selecting a namespace', async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetchNamespaces.mockResolvedValueOnce({
        namespaces: ['default', 'kube-system'],
      });

      // Act
      renderWithProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Open dropdown
      await user.click(screen.getByRole('combobox'));

      // Select "default"
      await user.click(screen.getByText('default'));

      // Assert
      expect(screen.getByText('default')).toBeInTheDocument();
    });

    it('should close dropdown after selecting an option', async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetchNamespaces.mockResolvedValueOnce({
        namespaces: ['default'],
      });

      // Act
      renderWithProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Open dropdown
      await user.click(screen.getByRole('combobox'));

      // Verify dropdown is open
      const defaultOption = screen.getAllByText('default');
      expect(defaultOption.length).toBeGreaterThan(0);

      // Select "default"
      await user.click(defaultOption[0]);

      // Assert - dropdown should close (only one "default" text remains in button)
      await waitFor(() => {
        const defaultTexts = screen.getAllByText('default');
        expect(defaultTexts.length).toBe(1);
      });
    });

    it('should update global context when namespace is selected', async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetchNamespaces.mockResolvedValueOnce({
        namespaces: ['default', 'kube-system'],
      });

      const ContextConsumer = () => {
        const { selectedNamespace } = useNamespace();
        return <div data-testid="selected-namespace">{selectedNamespace}</div>;
      };

      // Act
      render(
        <NamespaceProvider>
          <NamespaceSelector />
          <ContextConsumer />
        </NamespaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Assert initial state
      expect(screen.getByTestId('selected-namespace')).toHaveTextContent('all');

      // Open dropdown and select
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByText('kube-system'));

      // Assert context updated
      expect(screen.getByTestId('selected-namespace')).toHaveTextContent('kube-system');
    });

    it('should handle empty namespace list gracefully', async () => {
      // Arrange
      mockFetchNamespaces.mockResolvedValueOnce({
        namespaces: [],
      });

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Should still show "All Namespaces" option
      const user = userEvent.setup();
      await user.click(screen.getByRole('combobox'));
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1); // Only "All Namespaces"
      expect(options[0]).toHaveTextContent('All Namespaces');
    });

    it('should sort namespaces alphabetically', async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetchNamespaces.mockResolvedValueOnce({
        namespaces: ['zebra', 'alpha', 'beta'],
      });

      // Act
      renderWithProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('combobox'));

      // Assert - get all option elements and check order
      const options = screen.getAllByRole('option');
      const namespaceTexts = options.map((opt) => opt.textContent);

      // All Namespaces should be first, then alphabetically sorted
      expect(namespaceTexts[0]).toBe('All Namespaces');
      expect(namespaceTexts.slice(1)).toEqual(['alpha', 'beta', 'zebra']);
    });
  });

  describe('Error State', () => {
    it('should display error message when fetch fails', async () => {
      // Arrange
      mockFetchNamespaces.mockRejectedValueOnce(new Error('Network error'));

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/error loading namespaces/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      // Arrange
      mockFetchNamespaces.mockRejectedValueOnce(new Error('Network error'));

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should retry fetching namespaces when retry button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetchNamespaces
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ namespaces: ['default'] });

      // Act
      renderWithProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.getByText(/error loading namespaces/i)).toBeInTheDocument();
      });

      // Click retry
      await user.click(screen.getByRole('button', { name: /retry/i }));

      // Assert - should eventually show success state
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      expect(mockFetchNamespaces).toHaveBeenCalledTimes(2);
    });

    it('should display error details when available', async () => {
      // Arrange
      mockFetchNamespaces.mockRejectedValueOnce(new Error('Connection timeout'));

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/connection timeout/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      // Arrange
      mockFetchNamespaces.mockResolvedValueOnce({
        namespaces: ['default'],
      });

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        const combobox = screen.getByRole('combobox');
        expect(combobox).toHaveAccessibleName(/namespace/i);
      });
    });

    it('should be keyboard navigable', async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetchNamespaces.mockResolvedValueOnce({
        namespaces: ['default', 'kube-system'],
      });

      // Act
      renderWithProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Focus and activate with keyboard
      const combobox = screen.getByRole('combobox');
      await user.tab(); // Tab to focus
      expect(combobox).toHaveFocus();

      // Open with Enter or Space
      await user.keyboard('{Enter}');

      // Assert dropdown is open
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    });

    it('should have proper test IDs for E2E testing', async () => {
      // Arrange
      mockFetchNamespaces.mockResolvedValueOnce({
        namespaces: ['default'],
      });

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('namespace-selector')).toBeInTheDocument();
      });
    });
  });
});

// Import useNamespace for context consumer test
import { useNamespace } from '../context/NamespaceContext';
