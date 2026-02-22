/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ArgoTab } from './ArgoTab';

// Mock usePolling to avoid timer side effects in tests
vi.mock('../hooks/usePolling', () => ({
  usePolling: vi.fn(() => ({
    refresh: vi.fn(),
    lastUpdate: new Date(),
    isLoading: false,
  })),
}));

// Mock fetch API
global.fetch = vi.fn();

// Sample fixture data
const mockTemplates = [
  {
    name: 'data-processing-with-params',
    namespace: 'dashboard-test',
    parameters: [
      { name: 'input-path', value: '/data/input' },
      { name: 'output-path', value: '/data/output' },
      { name: 'batch-size', value: '100' },
      { name: 'env', value: 'dev', enum: ['dev', 'staging', 'prod'] },
    ],
  },
  {
    name: 'simple-template',
    namespace: 'dashboard-test',
    parameters: [],
  },
];

describe('ArgoTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render argo page container', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ArgoTab />);

      // Assert
      const argoPage = screen.getByTestId('argo-page');
      expect(argoPage).toBeInTheDocument();
    });

    it('should display Templates section by default', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ArgoTab />);

      // Assert
      const templatesSection = screen.getByTestId('workflow-templates-page');
      expect(templatesSection).toBeInTheDocument();
    });

    it('should have a page heading', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ArgoTab />);

      // Assert
      const heading = screen.getByRole('heading', { name: /argo/i });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton while fetching data', () => {
      // Arrange: Mock a delayed response
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: async () => [] }), 100)
          )
      );

      // Act
      render(<ArgoTab />);

      // Assert: LoadingSkeleton should be present
      const loadingSkeleton = screen.getByTestId('loading-skeleton');
      expect(loadingSkeleton).toBeInTheDocument();
    });

    it('should set aria-busy on loading skeleton', () => {
      // Arrange
      (global.fetch as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Act
      render(<ArgoTab />);

      // Assert
      const loadingSkeleton = screen.getByTestId('loading-skeleton');
      expect(loadingSkeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('should hide loading skeleton after data is loaded', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      // Act
      render(<ArgoTab />);

      // Assert: Wait for data to load
      await waitFor(() => {
        expect(
          screen.queryByText('data-processing-with-params')
        ).toBeInTheDocument();
      });

      // Loading skeleton should be gone
      const loadingSkeleton = screen.queryByTestId('loading-skeleton');
      expect(loadingSkeleton).not.toBeInTheDocument();
    });
  });

  describe('Success State - Templates List', () => {
    it('should render workflow template cards when data is loaded', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      // Act
      render(<ArgoTab />);

      // Assert
      await waitFor(() => {
        const cards = screen.getAllByTestId('workflow-template-card');
        expect(cards).toHaveLength(2);
      });
    });

    it('should display template names', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      // Act
      render(<ArgoTab />);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText('data-processing-with-params')
        ).toBeInTheDocument();
        expect(screen.getByText('simple-template')).toBeInTheDocument();
      });
    });

    it('should display template namespaces', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      // Act
      render(<ArgoTab />);

      // Assert
      await waitFor(() => {
        const namespaceElements = screen.getAllByTestId(
          'workflow-template-namespace'
        );
        expect(namespaceElements.length).toBeGreaterThanOrEqual(1);
        expect(namespaceElements[0]).toHaveTextContent('dashboard-test');
      });
    });

    it('should display parameter tags for templates with parameters', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      // Act
      render(<ArgoTab />);

      // Assert
      await waitFor(() => {
        const paramTags = screen.getAllByTestId('workflow-template-param-tag');
        // data-processing-with-params has 4 params
        expect(paramTags.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('should display "No parameters" for templates with empty parameters', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      // Act
      render(<ArgoTab />);

      // Assert: simple-template has no params so it shows "No parameters"
      await waitFor(() => {
        expect(screen.getByText('No parameters')).toBeInTheDocument();
      });
    });

    it('should display correct number of cards', async () => {
      // Arrange
      const manyTemplates = Array.from({ length: 5 }, (_, i) => ({
        name: `template-${i}`,
        namespace: 'default',
        parameters: [],
      }));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => manyTemplates,
      });

      // Act
      render(<ArgoTab />);

      // Assert
      await waitFor(() => {
        const cards = screen.getAllByTestId('workflow-template-card');
        expect(cards).toHaveLength(5);
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no templates exist', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ArgoTab />);

      // Assert
      await waitFor(() => {
        const emptyState = screen.getByTestId('empty-state');
        expect(emptyState).toBeInTheDocument();
      });
    });

    it('should display "No workflow templates found" message in empty state', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ArgoTab />);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText(/no workflow templates found/i)
        ).toBeInTheDocument();
      });
    });

    it('should not render template cards when empty', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ArgoTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });

      const cards = screen.queryAllByTestId('workflow-template-card');
      expect(cards).toHaveLength(0);
    });
  });

  describe('Error State', () => {
    it('should display error retry component when API call fails', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<ArgoTab />);

      // Assert
      await waitFor(() => {
        const errorRetry = screen.getByTestId('error-retry');
        expect(errorRetry).toBeInTheDocument();
      });
    });

    it('should have role="alert" on error component', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<ArgoTab />);

      // Assert
      await waitFor(() => {
        const errorRetry = screen.getByTestId('error-retry');
        expect(errorRetry).toHaveAttribute('role', 'alert');
      });
    });

    it('should display retry button on error', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<ArgoTab />);

      // Assert
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should handle HTTP 500 error response', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      });

      // Act
      render(<ArgoTab />);

      // Assert
      await waitFor(() => {
        const errorRetry = screen.getByTestId('error-retry');
        expect(errorRetry).toBeInTheDocument();
      });
    });

    it('should not render template cards on error', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<ArgoTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('error-retry')).toBeInTheDocument();
      });

      const cards = screen.queryAllByTestId('workflow-template-card');
      expect(cards).toHaveLength(0);
    });
  });

  describe('API Integration', () => {
    it('should fetch from /api/argo/workflow-templates endpoint', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ArgoTab />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/argo/workflow-templates')
        );
      });
    });

    it('should fetch without namespace filter by default', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ArgoTab />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/argo/workflow-templates'
        );
      });
    });

    it('should fetch with namespace filter when namespace prop is provided', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ArgoTab namespace="dashboard-test" />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/argo/workflow-templates?ns=dashboard-test'
        );
      });
    });

    it('should refetch when namespace prop changes', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTemplates,
        });

      // Act
      const { rerender } = render(<ArgoTab />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/argo/workflow-templates'
        );
      });

      rerender(<ArgoTab namespace="dashboard-test" />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/argo/workflow-templates?ns=dashboard-test'
        );
      });
    });
  });

  describe('Namespace Filtering', () => {
    it('should display templates filtered by namespace', async () => {
      // Arrange
      const filteredTemplates = [
        {
          name: 'dashboard-template',
          namespace: 'dashboard-test',
          parameters: [],
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => filteredTemplates,
      });

      // Act
      render(<ArgoTab namespace="dashboard-test" />);

      // Assert
      await waitFor(() => {
        const cards = screen.getAllByTestId('workflow-template-card');
        expect(cards).toHaveLength(1);
        expect(
          screen.getByText('dashboard-template')
        ).toBeInTheDocument();
      });
    });
  });
});
