/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

// Sample workflow run fixture data
const mockWorkflows = [
  {
    name: 'data-processing-abc12',
    namespace: 'dashboard-test',
    templateName: 'data-processing-with-params',
    phase: 'Succeeded',
    startedAt: '2026-02-22T08:00:00Z',
    finishedAt: '2026-02-22T09:00:00Z',
    nodes: [
      { name: 'step-1', phase: 'Succeeded' },
      { name: 'step-2', phase: 'Succeeded' },
    ],
  },
  {
    name: 'ml-training-xyz99',
    namespace: 'dashboard-test',
    templateName: 'ml-training',
    phase: 'Running',
    startedAt: '2026-02-22T10:00:00Z',
    finishedAt: '',
    nodes: [{ name: 'train', phase: 'Running' }],
  },
];

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

  // ---------------------------------------------------------------------------
  // WorkflowsSection: tab navigation and workflow run list
  // ---------------------------------------------------------------------------

  describe('WorkflowsSection - Tab Navigation', () => {
    it('should render a workflows tab button', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ArgoTab />);

      // Assert
      const workflowsTabButton = screen.getByTestId('workflows-tab');
      expect(workflowsTabButton).toBeInTheDocument();
    });

    it('should not show workflow-runs-page section by default', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ArgoTab />);

      // Assert: workflow-runs-page should not be rendered before clicking the tab
      const workflowRunsPage = screen.queryByTestId('workflow-runs-page');
      expect(workflowRunsPage).not.toBeInTheDocument();
    });

    it('should show workflow-runs-page section after clicking workflows tab', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })   // templates fetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] });  // workflows fetch

      render(<ArgoTab />);

      // Act
      const workflowsTabButton = screen.getByTestId('workflows-tab');
      fireEvent.click(workflowsTabButton);

      // Assert
      await waitFor(() => {
        const workflowRunsPage = screen.getByTestId('workflow-runs-page');
        expect(workflowRunsPage).toBeInTheDocument();
      });
    });

    it('should display workflow templates section by default (not workflow runs)', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ArgoTab />);

      // Assert: templates page should be visible
      expect(screen.getByTestId('workflow-templates-page')).toBeInTheDocument();
    });
  });

  describe('WorkflowsSection - Workflow Run List Rendering', () => {
    it('should render WorkflowCard items in workflow-runs-page after tab switch', async () => {
      // Arrange: first call returns templates, second call returns workflow runs
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows });

      render(<ArgoTab />);

      // Act: click the workflows tab
      const workflowsTabButton = screen.getByTestId('workflows-tab');
      fireEvent.click(workflowsTabButton);

      // Assert
      await waitFor(() => {
        const cards = screen.getAllByTestId('workflow-run-card');
        expect(cards).toHaveLength(2);
      });
    });

    it('should display workflow run names after tab switch', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows });

      render(<ArgoTab />);

      // Act
      fireEvent.click(screen.getByTestId('workflows-tab'));

      // Assert
      await waitFor(() => {
        expect(screen.getByText('data-processing-abc12')).toBeInTheDocument();
        expect(screen.getByText('ml-training-xyz99')).toBeInTheDocument();
      });
    });

    it('should show empty state in workflow-runs-page when no workflows exist', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<ArgoTab />);

      // Act
      fireEvent.click(screen.getByTestId('workflows-tab'));

      // Assert
      await waitFor(() => {
        const workflowRunsPage = screen.getByTestId('workflow-runs-page');
        expect(workflowRunsPage).toBeInTheDocument();
      });

      // No workflow run cards should be present
      const cards = screen.queryAllByTestId('workflow-run-card');
      expect(cards).toHaveLength(0);
    });

    it('should fetch from /api/argo/workflows endpoint when workflows tab is active', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows });

      render(<ArgoTab />);

      // Act
      fireEvent.click(screen.getByTestId('workflows-tab'));

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/argo/workflows')
        );
      });
    });

    it('should fetch workflows with namespace filter when namespace prop is provided', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows });

      render(<ArgoTab namespace="dashboard-test" />);

      // Act
      fireEvent.click(screen.getByTestId('workflows-tab'));

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/argo/workflows?ns=dashboard-test')
        );
      });
    });

    it('should show error retry when workflow fetch fails', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockRejectedValueOnce(new Error('Network error'));

      render(<ArgoTab />);

      // Act
      fireEvent.click(screen.getByTestId('workflows-tab'));

      // Assert
      await waitFor(() => {
        const workflowRunsPage = screen.getByTestId('workflow-runs-page');
        expect(workflowRunsPage).toBeInTheDocument();
        // An error retry element should appear inside the runs page
        const errorRetry = screen.getByTestId('error-retry');
        expect(errorRetry).toBeInTheDocument();
      });
    });

    it('should show loading skeleton while workflow runs are being fetched', async () => {
      // Arrange: templates resolve immediately; workflows never resolve
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockImplementationOnce(
          () => new Promise(() => {}) // Never resolves
        );

      render(<ArgoTab />);

      // Act
      fireEvent.click(screen.getByTestId('workflows-tab'));

      // Assert: loading skeleton should appear inside the runs page
      await waitFor(() => {
        expect(screen.getByTestId('workflow-runs-page')).toBeInTheDocument();
        expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // WorkflowDetail view swap (selectedWorkflow state)
  // ---------------------------------------------------------------------------

  describe('WorkflowDetail View Swap', () => {
    it('should not show workflow-detail-page by default', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ArgoTab />);

      // Assert: detail view should not be mounted initially
      const detailPage = screen.queryByTestId('workflow-detail-page');
      expect(detailPage).not.toBeInTheDocument();
    });

    it('should show workflow-detail-page when a WorkflowCard is clicked', async () => {
      // Arrange: templates → empty, workflows → mockWorkflows
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })             // templates
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows })  // workflows
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows[0] }); // detail

      render(<ArgoTab />);

      // Switch to Workflow Runs tab
      fireEvent.click(screen.getByTestId('workflows-tab'));

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-run-card')).toHaveLength(2);
      });

      // Act: click the first workflow card
      fireEvent.click(screen.getAllByTestId('workflow-run-card')[0]);

      // Assert
      await waitFor(() => {
        const detailPage = screen.getByTestId('workflow-detail-page');
        expect(detailPage).toBeInTheDocument();
      });
    });

    it('should hide workflow-runs-page when workflow-detail-page is shown', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows[0] });

      render(<ArgoTab />);

      fireEvent.click(screen.getByTestId('workflows-tab'));

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-run-card')).toHaveLength(2);
      });

      // Act
      fireEvent.click(screen.getAllByTestId('workflow-run-card')[0]);

      // Assert: workflow-runs-page should no longer be rendered
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-page')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('workflow-runs-page')).not.toBeInTheDocument();
    });

    it('should return to workflow-runs-page when back button is clicked', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows[0] });

      render(<ArgoTab />);

      fireEvent.click(screen.getByTestId('workflows-tab'));

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-run-card')).toHaveLength(2);
      });

      fireEvent.click(screen.getAllByTestId('workflow-run-card')[0]);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-page')).toBeInTheDocument();
      });

      // Act: click the back button inside the detail view
      const backButton = screen.getByTestId('workflow-detail-back-button');
      fireEvent.click(backButton);

      // Assert: workflow-runs-page should be visible again
      await waitFor(() => {
        expect(screen.getByTestId('workflow-runs-page')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('workflow-detail-page')).not.toBeInTheDocument();
    });

    it('should pass correct namespace and name to workflow detail page', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows[0] });

      render(<ArgoTab />);

      fireEvent.click(screen.getByTestId('workflows-tab'));

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-run-card')).toHaveLength(2);
      });

      // Act: click first workflow (data-processing-abc12, dashboard-test)
      fireEvent.click(screen.getAllByTestId('workflow-run-card')[0]);

      // Assert: the detail page should receive the correct namespace/name as data
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-page')).toBeInTheDocument();
      });

      // The detail page should render the selected workflow's name
      // (WorkflowDetail component will display it after fetching)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/argo/workflows/dashboard-test/data-processing-abc12')
      );
    });

    it('should not show workflow-detail-page when on templates tab', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ArgoTab />);

      // Assert: templates tab is default; no detail view
      expect(screen.queryByTestId('workflow-detail-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('workflow-templates-page')).toBeInTheDocument();
    });
  });
});
