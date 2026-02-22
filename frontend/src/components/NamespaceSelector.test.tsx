import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NamespaceSelector } from './NamespaceSelector';
import { NamespaceProvider } from '../contexts/NamespaceContext';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import * as namespacesApi from '../api/namespaces';

// Mock the namespaces API
vi.mock('../api/namespaces');

// Helper to render with NamespaceProvider only
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<NamespaceProvider>{ui}</NamespaceProvider>);
};

// Helper to render with both NamespaceProvider and FavoritesProvider
const renderWithFavoritesProvider = (ui: React.ReactElement) => {
  return render(
    <FavoritesProvider>
      <NamespaceProvider>{ui}</NamespaceProvider>
    </FavoritesProvider>
  );
};

describe('NamespaceSelector', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
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

      // Wait for loading to complete before opening dropdown
      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
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

      // Wait for loading to complete before opening dropdown
      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
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

      // Wait for loading to complete before opening dropdown
      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
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

      // Wait for loading to complete before opening dropdown
      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
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

      // Wait for loading to complete before opening dropdown
      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
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

      // Wait for loading to complete before opening dropdown
      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
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

      // Wait for loading to complete before opening dropdown
      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
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

      // Wait for loading to complete before opening dropdown
      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
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

      // Wait for loading to complete before opening dropdown
      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
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

      // Wait for loading to complete before opening dropdown
      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
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

      // Wait for loading to complete before opening dropdown
      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
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

  // ---------------------------------------------------------------------------
  // Favorites feature tests (TDD Red Phase)
  // ---------------------------------------------------------------------------

  describe('favorites - dropdown section structure', () => {
    it('should render Favorites section and All section headers when favorites exist', async () => {
      // Arrange
      localStorage.setItem('namespace-favorites', JSON.stringify(['default']));
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'production']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('namespace-favorites-header')).toBeInTheDocument();
        expect(screen.getByTestId('namespace-all-header')).toBeInTheDocument();
      });
    });

    it('should not render Favorites section when no favorites are set', async () => {
      // Arrange
      localStorage.removeItem('namespace-favorites');
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'production']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert
      await waitFor(() => {
        expect(screen.queryByTestId('namespace-favorites-section')).not.toBeInTheDocument();
      });
    });

    it('should render "All Namespaces" option at the top of the dropdown', async () => {
      // Arrange
      localStorage.setItem('namespace-favorites', JSON.stringify(['default']));
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'production']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('namespace-option-all')).toBeInTheDocument();
      });
    });

    it('should apply bg-gray-50 style class to section label headers', async () => {
      // Arrange
      localStorage.setItem('namespace-favorites', JSON.stringify(['default']));
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'production']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert
      await waitFor(() => {
        const favoritesHeader = screen.getByTestId('namespace-favorites-header');
        const allHeader = screen.getByTestId('namespace-all-header');
        expect(favoritesHeader).toHaveClass('bg-gray-50');
        expect(allHeader).toHaveClass('bg-gray-50');
      });
    });
  });

  describe('favorites - section content', () => {
    it('should display only favorites that actually exist in the namespace list', async () => {
      // Arrange - 'ghost-ns' does not exist in the fetched namespaces
      localStorage.setItem(
        'namespace-favorites',
        JSON.stringify(['default', 'ghost-ns'])
      );
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'production']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert - existing favorite is shown, non-existent one is not
      await waitFor(() => {
        expect(screen.getByTestId('namespace-favorite-item-default')).toBeInTheDocument();
        expect(screen.queryByTestId('namespace-favorite-item-ghost-ns')).not.toBeInTheDocument();
      });
    });

    it('should display non-favorited namespaces in the All section', async () => {
      // Arrange
      localStorage.setItem('namespace-favorites', JSON.stringify(['default']));
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'production', 'staging']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert - 'production' and 'staging' appear in All section; 'default' does not
      await waitFor(() => {
        expect(screen.getByTestId('namespace-option-production')).toBeInTheDocument();
        expect(screen.getByTestId('namespace-option-staging')).toBeInTheDocument();
      });
    });

    it('should not show a favorited namespace in the All section', async () => {
      // Arrange
      localStorage.setItem('namespace-favorites', JSON.stringify(['default']));
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'production']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert - 'default' is favorited so it must not appear in the All section
      await waitFor(() => {
        const allSection = screen.getByTestId('namespace-all-header').parentElement;
        expect(allSection).not.toBeNull();
        // namespace-option-default should either not be in the document or be inside favorites section only
        const allSectionOption = screen
          .queryAllByTestId('namespace-option-default')
          .find((el) => allSection!.contains(el));
        expect(allSectionOption).toBeUndefined();
      });
    });

    it('should render favorite items with correct data-testid pattern', async () => {
      // Arrange
      localStorage.setItem('namespace-favorites', JSON.stringify(['default', 'kube-system']));
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue([
        'default',
        'kube-system',
        'production',
      ]);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('namespace-favorite-item-default')).toBeInTheDocument();
        expect(screen.getByTestId('namespace-favorite-item-kube-system')).toBeInTheDocument();
      });
    });
  });

  describe('favorites - star toggle button', () => {
    it('should render a star toggle button for each namespace option in the All section', async () => {
      // Arrange
      localStorage.removeItem('namespace-favorites');
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'production']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert - each namespace option contains a favorite toggle button
      await waitFor(() => {
        const defaultOption = screen.getByTestId('namespace-option-default');
        const productionOption = screen.getByTestId('namespace-option-production');
        expect(
          defaultOption.querySelector('[data-testid="namespace-favorite-toggle"]')
        ).toBeInTheDocument();
        expect(
          productionOption.querySelector('[data-testid="namespace-favorite-toggle"]')
        ).toBeInTheDocument();
      });
    });

    it('should set aria-pressed="false" on toggle when namespace is not favorited', async () => {
      // Arrange
      localStorage.removeItem('namespace-favorites');
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert
      await waitFor(() => {
        const defaultOption = screen.getByTestId('namespace-option-default');
        const toggle = defaultOption.querySelector('[data-testid="namespace-favorite-toggle"]');
        expect(toggle).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('should set aria-pressed="true" on toggle when namespace is already favorited', async () => {
      // Arrange
      localStorage.setItem('namespace-favorites', JSON.stringify(['default']));
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'production']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown; 'default' lives in the Favorites section so we check there
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert - the toggle inside the favorites-section item for 'default' is pressed
      await waitFor(() => {
        const favItem = screen.getByTestId('namespace-favorite-item-default');
        const toggle = favItem.querySelector('[data-testid="namespace-favorite-toggle"]');
        expect(toggle).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('should have an aria-label containing "favorite" on the toggle button', async () => {
      // Arrange
      localStorage.removeItem('namespace-favorites');
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert
      await waitFor(() => {
        const defaultOption = screen.getByTestId('namespace-option-default');
        const toggle = defaultOption.querySelector('[data-testid="namespace-favorite-toggle"]');
        expect(toggle).toHaveAttribute('aria-label', expect.stringMatching(/favorite/i));
      });
    });
  });

  describe('favorites - toggle interaction', () => {
    it('should call toggleFavorite and add namespace to favorites when star button is clicked', async () => {
      // Arrange
      localStorage.removeItem('namespace-favorites');
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'production']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown and click the toggle for 'default'
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      await waitFor(() => {
        expect(screen.getByTestId('namespace-option-default')).toBeInTheDocument();
      });

      const defaultOption = screen.getByTestId('namespace-option-default');
      const toggle = defaultOption.querySelector(
        '[data-testid="namespace-favorite-toggle"]'
      ) as HTMLElement;
      fireEvent.click(toggle);

      // Assert - localStorage is updated
      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem('namespace-favorites') ?? '[]');
        expect(stored).toContain('default');
      });
    });

    it('should remove namespace from favorites when star is clicked on an already-favorited item', async () => {
      // Arrange
      localStorage.setItem('namespace-favorites', JSON.stringify(['default']));
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'production']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown and click the toggle inside the favorites section item
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      await waitFor(() => {
        expect(screen.getByTestId('namespace-favorite-item-default')).toBeInTheDocument();
      });

      const favItem = screen.getByTestId('namespace-favorite-item-default');
      const toggle = favItem.querySelector(
        '[data-testid="namespace-favorite-toggle"]'
      ) as HTMLElement;
      fireEvent.click(toggle);

      // Assert - localStorage no longer contains 'default'
      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem('namespace-favorites') ?? '[]');
        expect(stored).not.toContain('default');
      });
    });

    it('should keep the dropdown open after clicking the star toggle (stopPropagation)', async () => {
      // Arrange
      localStorage.removeItem('namespace-favorites');
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'production']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeVisible();
      });

      const defaultOption = screen.getByTestId('namespace-option-default');
      const toggle = defaultOption.querySelector(
        '[data-testid="namespace-favorite-toggle"]'
      ) as HTMLElement;

      // Act - click star toggle
      fireEvent.click(toggle);

      // Assert - listbox is still visible
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeVisible();
      });
    });

    it('should select namespace and close dropdown when the option label text is clicked', async () => {
      // Arrange
      localStorage.removeItem('namespace-favorites');
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'production']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      await waitFor(() => {
        expect(screen.getByTestId('namespace-option-label-default')).toBeInTheDocument();
      });

      // Click the label (text area) not the star button
      const optionLabel = screen.getByTestId('namespace-option-label-default');
      fireEvent.click(optionLabel);

      // Assert - namespace is selected and dropdown closes
      await waitFor(() => {
        expect(selector).toHaveTextContent(/default/i);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('should update aria-pressed to true after adding to favorites', async () => {
      // Arrange
      localStorage.removeItem('namespace-favorites');
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      await waitFor(() => {
        expect(screen.getByTestId('namespace-option-default')).toBeInTheDocument();
      });

      const defaultOption = screen.getByTestId('namespace-option-default');
      const toggle = defaultOption.querySelector(
        '[data-testid="namespace-favorite-toggle"]'
      ) as HTMLElement;

      expect(toggle).toHaveAttribute('aria-pressed', 'false');

      // Act - click toggle to add favorite
      fireEvent.click(toggle);

      // Assert - the item moved to favorites section; toggle in that section is now pressed
      await waitFor(() => {
        const favItem = screen.getByTestId('namespace-favorite-item-default');
        const favToggle = favItem.querySelector(
          '[data-testid="namespace-favorite-toggle"]'
        );
        expect(favToggle).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('favorites - edge cases', () => {
    it('should handle empty namespace list gracefully with no favorites', async () => {
      // Arrange
      localStorage.removeItem('namespace-favorites');
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue([]);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      await waitFor(() => {
        const selector = screen.getByRole('combobox');
        expect(selector).toBeEnabled();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert - no favorites section, standard empty message shown
      await waitFor(() => {
        expect(screen.queryByTestId('namespace-favorites-section')).not.toBeInTheDocument();
        expect(screen.getByText(/no namespaces available/i)).toBeInTheDocument();
      });
    });

    it('should ignore a stored favorite that does not exist in the fetched namespace list', async () => {
      // Arrange
      localStorage.setItem('namespace-favorites', JSON.stringify(['ghost-ns']));
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'production']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert - the ghost namespace does not appear as a favorites item
      await waitFor(() => {
        expect(
          screen.queryByTestId('namespace-favorite-item-ghost-ns')
        ).not.toBeInTheDocument();
      });
    });

    it('should render both sections correctly when all namespaces are favorited', async () => {
      // Arrange
      localStorage.setItem(
        'namespace-favorites',
        JSON.stringify(['default', 'production'])
      );
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue(['default', 'production']);

      renderWithFavoritesProvider(<NamespaceSelector />);

      await waitFor(() => {
        expect(screen.queryByTestId('namespace-loading')).not.toBeInTheDocument();
      });

      // Act - open dropdown
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);

      // Assert - favorites section shows both, All section has no namespace options
      await waitFor(() => {
        expect(screen.getByTestId('namespace-favorite-item-default')).toBeInTheDocument();
        expect(screen.getByTestId('namespace-favorite-item-production')).toBeInTheDocument();
        // All section header still present
        expect(screen.getByTestId('namespace-all-header')).toBeInTheDocument();
        // No namespace options in the All section
        expect(screen.queryByTestId('namespace-option-default')).not.toBeInTheDocument();
        expect(screen.queryByTestId('namespace-option-production')).not.toBeInTheDocument();
      });
    });
  });
});
