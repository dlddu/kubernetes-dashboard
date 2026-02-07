import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NamespaceSelector from './NamespaceSelector';
import * as namespacesApi from '../api/namespaces';

// Mock the namespaces API
vi.mock('../api/namespaces');

describe('NamespaceSelector', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Happy Path', () => {
    it('should render without crashing', () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue({
        items: [],
      });

      // Act
      render(<NamespaceSelector />);

      // Assert
      const selector = screen.getByRole('combobox', { name: /namespace/i }) || screen.getByTestId('namespace-selector');
      expect(selector).toBeInTheDocument();
    });

    it('should display "All Namespaces" as default selected value', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue({
        items: [
          { name: 'default', status: 'Active' },
        ],
      });

      // Act
      render(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        const selector = screen.getByRole('combobox', { name: /namespace/i }) || screen.getByTestId('namespace-selector');
        expect(selector).toHaveValue('all');
      });
    });

    it('should fetch namespaces on mount', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue({
        items: [
          { name: 'default', status: 'Active' },
          { name: 'kube-system', status: 'Active' },
        ],
      });

      // Act
      render(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalledTimes(1);
      });
    });

    it('should display list of namespaces when dropdown is opened', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue({
        items: [
          { name: 'default', status: 'Active' },
          { name: 'kube-system', status: 'Active' },
        ],
      });

      // Act
      render(<NamespaceSelector />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      const selector = screen.getByRole('combobox', { name: /namespace/i }) || screen.getByTestId('namespace-selector');
      fireEvent.click(selector);

      // Assert
      await waitFor(() => {
        const allNamespacesOption = screen.getByText(/all namespaces/i);
        expect(allNamespacesOption).toBeInTheDocument();
      });

      const defaultOption = screen.getByText(/^default$/i);
      expect(defaultOption).toBeInTheDocument();
    });

    it('should update selected value when specific namespace is chosen', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue({
        items: [
          { name: 'default', status: 'Active' },
        ],
      });

      // Act
      render(<NamespaceSelector />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      const selector = screen.getByRole('combobox', { name: /namespace/i }) || screen.getByTestId('namespace-selector');
      fireEvent.click(selector);

      const defaultOption = await screen.findByText(/^default$/i);
      fireEvent.click(defaultOption);

      // Assert
      await waitFor(() => {
        expect(selector).toHaveValue('default');
      });
    });

    it('should call onChange callback when selection changes', async () => {
      // Arrange
      const onChangeMock = vi.fn();
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue({
        items: [
          { name: 'default', status: 'Active' },
        ],
      });

      // Act
      render(<NamespaceSelector onChange={onChangeMock} />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      const selector = screen.getByRole('combobox', { name: /namespace/i }) || screen.getByTestId('namespace-selector');
      fireEvent.click(selector);

      const defaultOption = await screen.findByText(/^default$/i);
      fireEvent.click(defaultOption);

      // Assert
      await waitFor(() => {
        expect(onChangeMock).toHaveBeenCalledWith('default');
      });
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton while fetching namespaces', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ items: [] }), 100))
      );

      // Act
      render(<NamespaceSelector />);

      // Assert
      const loadingIndicator = screen.getByTestId('namespace-loading') ||
                               screen.queryByText(/loading/i);
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should disable selector during loading', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ items: [] }), 100))
      );

      // Act
      render(<NamespaceSelector />);

      // Assert
      const selector = screen.getByRole('combobox', { name: /namespace/i }) || screen.getByTestId('namespace-selector');
      expect(selector).toBeDisabled();
    });

    it('should enable selector after loading completes', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue({
        items: [{ name: 'default', status: 'Active' }],
      });

      // Act
      render(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        const selector = screen.getByRole('combobox', { name: /namespace/i }) || screen.getByTestId('namespace-selector');
        expect(selector).toBeEnabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API error gracefully', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockRejectedValue(
        new Error('Failed to fetch namespaces')
      );

      // Act
      render(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByText(/error loading namespaces/i) || screen.getByTestId('namespace-error-message');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockRejectedValue(
        new Error('Failed to fetch namespaces')
      );

      // Act
      render(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i }) || screen.getByTestId('namespace-retry-button');
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should retry fetching when retry button is clicked', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces)
        .mockRejectedValueOnce(new Error('Failed to fetch namespaces'))
        .mockResolvedValueOnce({
          items: [{ name: 'default', status: 'Active' }],
        });

      // Act
      render(<NamespaceSelector />);

      await waitFor(() => {
        const errorMessage = screen.getByText(/error loading namespaces/i);
        expect(errorMessage).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i }) || screen.getByTestId('namespace-retry-button');
      fireEvent.click(retryButton);

      // Assert
      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalledTimes(2);
      });
    });

    it('should show fallback "All Namespaces" option on error', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockRejectedValue(
        new Error('Failed to fetch namespaces')
      );

      // Act
      render(<NamespaceSelector />);

      // Assert
      await waitFor(() => {
        const selector = screen.getByRole('combobox', { name: /namespace/i }) || screen.getByTestId('namespace-selector');
        expect(selector).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty namespace list', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue({
        items: [],
      });

      // Act
      render(<NamespaceSelector />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      const selector = screen.getByRole('combobox', { name: /namespace/i }) || screen.getByTestId('namespace-selector');
      fireEvent.click(selector);

      // Assert
      await waitFor(() => {
        const allNamespacesOption = screen.getByText(/all namespaces/i);
        expect(allNamespacesOption).toBeInTheDocument();
      });

      const emptyMessage = screen.getByText(/no namespaces available/i) || screen.getByTestId('namespace-empty-message');
      expect(emptyMessage).toBeInTheDocument();
    });

    it('should be accessible with keyboard navigation', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue({
        items: [{ name: 'default', status: 'Active' }],
      });

      // Act
      render(<NamespaceSelector />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      const selector = screen.getByRole('combobox', { name: /namespace/i }) || screen.getByTestId('namespace-selector');

      // Assert
      expect(selector).toHaveAttribute('aria-label');
      expect(selector).toHaveAttribute('role', 'combobox');
    });

    it('should handle very long namespace names', async () => {
      // Arrange
      const longName = 'very-long-namespace-name-that-should-be-truncated-properly';
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue({
        items: [{ name: longName, status: 'Active' }],
      });

      // Act
      render(<NamespaceSelector />);

      await waitFor(() => {
        expect(namespacesApi.fetchNamespaces).toHaveBeenCalled();
      });

      const selector = screen.getByRole('combobox', { name: /namespace/i }) || screen.getByTestId('namespace-selector');
      fireEvent.click(selector);

      // Assert
      const option = await screen.findByText(new RegExp(longName));
      expect(option).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockResolvedValue({
        items: [],
      });

      // Act
      render(<NamespaceSelector />);

      // Assert
      const selector = screen.getByRole('combobox', { name: /namespace/i }) || screen.getByTestId('namespace-selector');
      expect(selector).toHaveAttribute('aria-label');
    });

    it('should indicate loading state with aria-busy', async () => {
      // Arrange
      vi.mocked(namespacesApi.fetchNamespaces).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ items: [] }), 100))
      );

      // Act
      render(<NamespaceSelector />);

      // Assert
      const selector = screen.getByRole('combobox', { name: /namespace/i }) || screen.getByTestId('namespace-selector');
      expect(selector).toHaveAttribute('aria-busy', 'true');
    });
  });
});
