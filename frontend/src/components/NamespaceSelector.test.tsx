import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NamespaceSelector } from './NamespaceSelector';
import { NamespaceProvider } from '../contexts/NamespaceContext';
import * as namespacesApi from '../api/namespaces';

// Mock the namespaces API
vi.mock('../api/namespaces');

// Helper to render with NamespaceProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<NamespaceProvider>{ui}</NamespaceProvider>);
};

describe('NamespaceSelector', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default']);

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert - Component should render
      const selector = screen.getByTestId('namespace-selector');
      expect(selector).toBeInTheDocument();
    });

    it('should display dropdown with accessible role', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default']);

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        const dropdown = screen.getByRole('combobox', { name: /namespace/i });
        expect(dropdown).toBeInTheDocument();
        expect(dropdown).toBeEnabled();
      });
    });

    it('should show "All Namespaces" as default option', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'kube-system']);

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        const selector = screen.getByRole('combobox');
        expect(selector).toHaveTextContent(/all namespaces/i);
      });
    });
  });

  describe('fetching namespaces', () => {
    it('should fetch namespaces on mount', async () => {
      // Arrange
      const mockNamespaces = ['default', 'kube-system', 'kube-public'];
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(mockNamespaces);

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalledTimes(1);
      });
    });

    it('should display fetched namespaces in dropdown', async () => {
      // Arrange
      const mockNamespaces = ['default', 'production', 'staging'];
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(mockNamespaces);

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Wait for data to load
      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      // Open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('default')).toBeInTheDocument();
        expect(screen.getByText('production')).toBeInTheDocument();
        expect(screen.getByText('staging')).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('should show loading indicator while fetching namespaces', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(['default']), 100))
      );

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert - Should show loading state immediately
      const loadingIndicator = screen.getByTestId('namespace-loading');
      expect(loadingIndicator).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });
    });

    it('should display skeleton UI during loading', () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(['default']), 100))
      );

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      const skeleton = screen.getByTestId('namespace-skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass(/skeleton|animate-pulse/i);
    });

    it('should disable dropdown while loading', () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(['default']), 100))
      );

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      const selector = screen.getByRole('combobox');
      expect(selector).toBeDisabled();
    });
  });

  describe('error handling', () => {
    it('should display error message when fetch fails', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockRejectedValue(
        new Error('Failed to fetch namespaces')
      );

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByText(/error loading namespaces/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockRejectedValue(
        new Error('Network error')
      );

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
        expect(retryButton).toBeEnabled();
      });
    });

    it('should retry fetching when retry button is clicked', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(['default']);

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/error loading namespaces/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Assert
      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalledTimes(2);
      });
    });

    it('should fallback to "All Namespaces" only on error', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockRejectedValue(
        new Error('Failed to fetch')
      );

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        const selector = screen.getByRole('combobox');
        expect(selector).toHaveTextContent(/all namespaces/i);
      });
    });
  });

  describe('user interaction', () => {
    it('should open dropdown when clicked', async () => {
      // Arrange
      const mockNamespaces = ['default', 'production'];
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(mockNamespaces);

      renderWithProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      // Act
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert
      await waitFor(() => {
        const dropdown = screen.getByRole('listbox');
        expect(dropdown).toBeVisible();
      });
    });

    it('should select namespace when option is clicked', async () => {
      // Arrange
      const mockNamespaces = ['default', 'production', 'staging'];
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(mockNamespaces);

      renderWithProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      // Open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Act - Click on 'production' option
      await waitFor(() => {
        const productionOption = screen.getByRole('option', { name: /production/i });
        fireEvent.click(productionOption);
      });

      // Assert
      await waitFor(() => {
        expect(selector).toHaveTextContent(/production/i);
      });
    });

    it('should close dropdown after selection', async () => {
      // Arrange
      const mockNamespaces = ['default', 'production'];
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(mockNamespaces);

      renderWithProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Act
      await waitFor(() => {
        const defaultOption = screen.getByRole('option', { name: /^default$/i });
        fireEvent.click(defaultOption);
      });

      // Assert
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('should close dropdown when clicking outside', async () => {
      // Arrange
      const mockNamespaces = ['default', 'production'];
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(mockNamespaces);

      renderWithProvider(
        <div>
          <NamespaceSelector />
          <div data-testid="outside-element">Outside element</div>
        </div>
      );

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      // Open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeVisible();
      });

      // Act - Click outside the dropdown
      const outsideElement = screen.getByTestId('outside-element');
      fireEvent.mouseDown(outsideElement);

      // Assert
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('should close dropdown when pressing Escape key', async () => {
      // Arrange
      const mockNamespaces = ['default', 'production'];
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(mockNamespaces);

      renderWithProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      // Open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeVisible();
      });

      // Act - Press Escape key
      fireEvent.keyDown(selector, { key: 'Escape' });

      // Assert
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('context integration', () => {
    it('should update context when namespace is selected', async () => {
      // Arrange
      const mockNamespaces = ['default', 'production'];
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(mockNamespaces);

      renderWithProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Act
      await waitFor(() => {
        const productionOption = screen.getByRole('option', { name: /production/i });
        fireEvent.click(productionOption);
      });

      // Assert - Selector displays selected namespace from context
      await waitFor(() => {
        expect(selector).toHaveTextContent(/production/i);
      });
    });

    it('should sync with context when selecting All Namespaces', async () => {
      // Arrange
      const mockNamespaces = ['default', 'production'];
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(mockNamespaces);

      renderWithProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      // First select a specific namespace
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      await waitFor(() => {
        const productionOption = screen.getByRole('option', { name: /production/i });
        fireEvent.click(productionOption);
      });

      await waitFor(() => {
        expect(selector).toHaveTextContent(/production/i);
      });

      // Act - Select "All Namespaces"
      fireEvent.click(selector);
      await waitFor(() => {
        const allOption = screen.getByRole('option', { name: /all namespaces/i });
        fireEvent.click(allOption);
      });

      // Assert
      await waitFor(() => {
        expect(selector).toHaveTextContent(/all namespaces/i);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty namespace list', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue([]);

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      // Wait for loading state to finish
      await waitFor(() => {
        const selector = screen.getByRole('combobox');
        expect(selector).toBeEnabled();
      });

      // Open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert
      await waitFor(() => {
        const emptyMessage = screen.getByText(/no namespaces available/i);
        expect(emptyMessage).toBeInTheDocument();
      });
    });

    it('should handle very long namespace names', async () => {
      // Arrange
      const longNamespace = 'very-long-namespace-name-that-might-break-ui-layout';
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue([longNamespace]);

      // Act
      renderWithProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert
      await waitFor(() => {
        const option = screen.getByText(longNamespace);
        expect(option).toBeInTheDocument();
      });
    });

    it('should handle namespace names with special characters', async () => {
      // Arrange
      const specialNamespaces = ['my-app-prod', 'test_env', 'dev.local'];
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(specialNamespaces);

      // Act
      renderWithProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('my-app-prod')).toBeInTheDocument();
        expect(screen.getByText('test_env')).toBeInTheDocument();
        expect(screen.getByText('dev.local')).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default']);

      // Act
      renderWithProvider(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        const selector = screen.getByRole('combobox');
        expect(selector).toHaveAttribute('aria-label', expect.stringMatching(/namespace/i));
      });
    });

    it('should be keyboard navigable', async () => {
      // Arrange
      const mockNamespaces = ['default', 'production', 'staging'];
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(mockNamespaces);

      renderWithProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      // Act - Use keyboard to open dropdown
      const selector = screen.getByRole('combobox');
      selector.focus();
      fireEvent.keyDown(selector, { key: 'Enter' });

      // Assert
      await waitFor(() => {
        const dropdown = screen.getByRole('listbox');
        expect(dropdown).toBeVisible();
      });
    });
  });
});
