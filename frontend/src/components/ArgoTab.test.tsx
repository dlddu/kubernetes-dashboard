/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
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

// Helper to render ArgoTab with router context
function renderArgoTab(props: { namespace?: string } = {}, initialEntry = '/argo') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/argo/*" element={<ArgoTab {...props} />} />
      </Routes>
    </MemoryRouter>
  );
}

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab();

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
      renderArgoTab({ namespace: 'dashboard-test' });

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
      const { rerender } = render(
        <MemoryRouter initialEntries={['/argo']}>
          <Routes>
            <Route path="/argo/*" element={<ArgoTab />} />
          </Routes>
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/argo/workflow-templates'
        );
      });

      rerender(
        <MemoryRouter initialEntries={['/argo']}>
          <Routes>
            <Route path="/argo/*" element={<ArgoTab namespace="dashboard-test" />} />
          </Routes>
        </MemoryRouter>
      );

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
      renderArgoTab({ namespace: 'dashboard-test' });

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
  // WorkflowsSection: template card click → runs view navigation (DLD-531)
  // ---------------------------------------------------------------------------

  describe('WorkflowsSection - Template Card Click Navigation', () => {
    it('should NOT render a standalone workflows-tab button in the DOM', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      renderArgoTab();

      // Assert: independent "Workflow Runs" tab button must not exist after DLD-531
      const workflowsTabButton = screen.queryByTestId('workflows-tab');
      expect(workflowsTabButton).not.toBeInTheDocument();
    });

    it('should not show workflow-runs-page by default', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      renderArgoTab();

      // Assert: runs view must not be visible until a template card is clicked
      const workflowRunsPage = screen.queryByTestId('workflow-runs-page');
      expect(workflowRunsPage).not.toBeInTheDocument();
    });

    it('should show workflow-runs-page after clicking a template card', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Act: click the first template card
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('workflow-runs-page')).toBeInTheDocument();
      });
    });

    it('should hide workflow-templates-page when workflow-runs-page is shown', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Act
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

      // Assert: templates page must be hidden
      await waitFor(() => {
        expect(screen.getByTestId('workflow-runs-page')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('workflow-templates-page')).not.toBeInTheDocument();
    });

    it('should display "{templateName} Runs" in the runs view header', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Act: click the first template ('data-processing-with-params')
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

      // Assert: header must contain the selected template name
      await waitFor(() => {
        expect(screen.getByTestId('workflow-runs-page')).toBeInTheDocument();
      });

      const runsHeader = screen.getByTestId('workflow-runs-page').querySelector('h2');
      expect(runsHeader).toBeInTheDocument();
      expect(runsHeader).toHaveTextContent('data-processing-with-params');
      expect(runsHeader).toHaveTextContent('Runs');
    });

    it('should pass selectedTemplateName to fetchWorkflows when a template card is clicked', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Act: click the first template card ('data-processing-with-params')
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

      // Assert: fetchWorkflows must be called with the template name as a query param
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('templateName=data-processing-with-params')
        );
      });
    });

    it('should pass selectedTemplateName and namespace to fetchWorkflows when namespace prop is set', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderArgoTab({ namespace: 'dashboard-test' });

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Act: click the first template card
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

      // Assert: both ns and templateName query params must be present
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('ns=dashboard-test')
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('templateName=data-processing-with-params')
        );
      });
    });

    it('should return to workflow-templates-page when back-to-templates button is clicked', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-runs-page')).toBeInTheDocument();
      });

      // Act: click the back button
      const backButton = screen.getByTestId('back-to-templates');
      fireEvent.click(backButton);

      // Assert: templates page is visible again
      await waitFor(() => {
        expect(screen.getByTestId('workflow-templates-page')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('workflow-runs-page')).not.toBeInTheDocument();
    });

    it('should render back-to-templates button in the runs view header', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Act
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

      // Assert: back button must be present inside runs page
      await waitFor(() => {
        expect(screen.getByTestId('workflow-runs-page')).toBeInTheDocument();
      });

      expect(screen.getByTestId('back-to-templates')).toBeInTheDocument();
    });

    it('should NOT switch to runs view when Submit button inside a template card is clicked', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Act: click the Submit button (not the card itself)
      const submitButtons = screen.getAllByTestId('submit-button');
      fireEvent.click(submitButtons[0]);

      // Assert: runs page must NOT appear — submit opens a modal, not the runs view
      expect(screen.queryByTestId('workflow-runs-page')).not.toBeInTheDocument();

      // Assert: templates page is still visible
      expect(screen.getByTestId('workflow-templates-page')).toBeInTheDocument();
    });

    it('should display workflow templates section by default', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      renderArgoTab();

      // Assert
      expect(screen.getByTestId('workflow-templates-page')).toBeInTheDocument();
    });
  });

  describe('WorkflowsSection - Workflow Run List Rendering', () => {
    it('should render WorkflowCard items in workflow-runs-page after template card click', async () => {
      // Arrange: first call returns templates, second call returns workflow runs
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Act: click the first template card to enter the runs view
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

      // Assert
      await waitFor(() => {
        const cards = screen.getAllByTestId('workflow-run-card');
        expect(cards).toHaveLength(2);
      });
    });

    it('should display workflow run names after template card click', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Act
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('data-processing-abc12')).toBeInTheDocument();
        expect(screen.getByText('ml-training-xyz99')).toBeInTheDocument();
      });
    });

    it('should show empty state in workflow-runs-page when no workflows exist', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Act
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

      // Assert
      await waitFor(() => {
        const workflowRunsPage = screen.getByTestId('workflow-runs-page');
        expect(workflowRunsPage).toBeInTheDocument();
      });

      // No workflow run cards should be present
      const cards = screen.queryAllByTestId('workflow-run-card');
      expect(cards).toHaveLength(0);
    });

    it('should fetch from /api/argo/workflows endpoint when a template card is clicked', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Act
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

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
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows });

      renderArgoTab({ namespace: 'dashboard-test' });

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Act
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('ns=dashboard-test')
        );
      });
    });

    it('should show error retry when workflow fetch fails', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockRejectedValueOnce(new Error('Network error'));

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Act
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

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
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockImplementationOnce(
          () => new Promise(() => {}) // Never resolves
        );

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Act
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

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

  // ---------------------------------------------------------------------------
  // handleNavigateToWorkflows: SubmitModal "View Workflow" click → runs view
  // ---------------------------------------------------------------------------

  describe('handleNavigateToWorkflows - SubmitModal View Workflow Navigation', () => {
    it('should open SubmitModal when Submit button on a template card is clicked', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Act: click the Submit button on the first template card
      const submitButtons = screen.getAllByTestId('submit-button');
      fireEvent.click(submitButtons[0]);

      // Assert: SubmitModal dialog must be open
      expect(screen.getByTestId('submit-workflow-dialog')).toBeInTheDocument();
    });

    it('should close SubmitModal and show workflow-runs-page when "View Workflow" is clicked after successful submit', async () => {
      // Arrange: templates load, then POST submit succeeds
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ name: 'data-processing-with-params-abc12', namespace: 'dashboard-test' }),
        })
        .mockResolvedValueOnce({ ok: true, json: async () => [] }); // workflow runs fetch

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Open SubmitModal by clicking Submit on first template card
      const submitButtons = screen.getAllByTestId('submit-button');
      fireEvent.click(submitButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('submit-workflow-dialog')).toBeInTheDocument();
      });

      // Submit the workflow
      fireEvent.click(screen.getByTestId('confirm-button'));

      // Wait for the success state with "View Workflow" button
      await waitFor(() => {
        expect(screen.getByTestId('view-workflow-link')).toBeInTheDocument();
      });

      // Act: click "View Workflow"
      fireEvent.click(screen.getByTestId('view-workflow-link'));

      // Assert: SubmitModal is closed (dialog gone) and runs view is shown
      await waitFor(() => {
        expect(screen.getByTestId('workflow-runs-page')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('submit-workflow-dialog')).not.toBeInTheDocument();
    });

    it('should hide workflow-templates-page when navigating to runs view via "View Workflow"', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ name: 'data-processing-with-params-abc12', namespace: 'dashboard-test' }),
        })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Open modal and submit
      fireEvent.click(screen.getAllByTestId('submit-button')[0]);
      await waitFor(() => expect(screen.getByTestId('submit-workflow-dialog')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('confirm-button'));
      await waitFor(() => expect(screen.getByTestId('view-workflow-link')).toBeInTheDocument());

      // Act: navigate to workflows
      fireEvent.click(screen.getByTestId('view-workflow-link'));

      // Assert: templates page is no longer rendered
      await waitFor(() => {
        expect(screen.getByTestId('workflow-runs-page')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('workflow-templates-page')).not.toBeInTheDocument();
    });

    it('should display submitted template name in runs view header after "View Workflow" click', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ name: 'data-processing-with-params-abc12', namespace: 'dashboard-test' }),
        })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Open modal for 'data-processing-with-params' (first card's Submit button)
      fireEvent.click(screen.getAllByTestId('submit-button')[0]);
      await waitFor(() => expect(screen.getByTestId('submit-workflow-dialog')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('confirm-button'));
      await waitFor(() => expect(screen.getByTestId('view-workflow-link')).toBeInTheDocument());

      // Act
      fireEvent.click(screen.getByTestId('view-workflow-link'));

      // Assert: runs view header must contain the submitted template name
      await waitFor(() => {
        expect(screen.getByTestId('workflow-runs-page')).toBeInTheDocument();
      });

      const runsHeader = screen.getByTestId('workflow-runs-page').querySelector('h2');
      expect(runsHeader).toBeInTheDocument();
      expect(runsHeader).toHaveTextContent('data-processing-with-params');
      expect(runsHeader).toHaveTextContent('Runs');
    });

    it('should fetch workflows filtered by submitted template name after "View Workflow" click', async () => {
      // Arrange
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ name: 'data-processing-with-params-abc12', namespace: 'dashboard-test' }),
        })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      fireEvent.click(screen.getAllByTestId('submit-button')[0]);
      await waitFor(() => expect(screen.getByTestId('submit-workflow-dialog')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('confirm-button'));
      await waitFor(() => expect(screen.getByTestId('view-workflow-link')).toBeInTheDocument());

      // Act
      fireEvent.click(screen.getByTestId('view-workflow-link'));

      // Assert: workflow runs fetch must use the submitted template name as query param
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('templateName=data-processing-with-params')
        );
      });
    });

    it('should keep workflow-templates-page visible when SubmitModal is cancelled', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Open modal
      fireEvent.click(screen.getAllByTestId('submit-button')[0]);
      await waitFor(() => expect(screen.getByTestId('submit-workflow-dialog')).toBeInTheDocument());

      // Act: cancel the modal
      fireEvent.click(screen.getByTestId('cancel-button'));

      // Assert: templates page is still shown, no runs page
      expect(screen.getByTestId('workflow-templates-page')).toBeInTheDocument();
      expect(screen.queryByTestId('workflow-runs-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('submit-workflow-dialog')).not.toBeInTheDocument();
    });

    it('should not navigate to runs view when submit fails and "View Workflow" is never shown', async () => {
      // Arrange: templates load, then POST submit fails
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal Server Error' }),
        });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });

      // Open modal and submit
      fireEvent.click(screen.getAllByTestId('submit-button')[0]);
      await waitFor(() => expect(screen.getByTestId('submit-workflow-dialog')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('confirm-button'));

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByTestId('submit-error-view')).toBeInTheDocument();
      });

      // Assert: "View Workflow" button does not appear
      expect(screen.queryByTestId('view-workflow-link')).not.toBeInTheDocument();

      // Assert: runs page is not shown; modal is still open with error
      expect(screen.queryByTestId('workflow-runs-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('submit-workflow-dialog')).toBeInTheDocument();
    });
  });

  describe('WorkflowDetail View Swap', () => {
    it('should not show workflow-detail-page by default', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      renderArgoTab();

      // Assert: detail view should not be mounted initially
      const detailPage = screen.queryByTestId('workflow-detail-page');
      expect(detailPage).not.toBeInTheDocument();
    });

    it('should show workflow-detail-page when a WorkflowCard is clicked', async () => {
      // Arrange: templates → mockTemplates, workflows → mockWorkflows, detail → mockWorkflows[0]
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })    // templates
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows })    // workflows
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows[0] }); // detail

      renderArgoTab();

      // Navigate to Runs view via template card click
      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

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
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows[0] });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

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
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows[0] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows }); // re-fetch on back

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

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
        .mockResolvedValueOnce({ ok: true, json: async () => mockTemplates })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows[0] });

      renderArgoTab();

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-template-card')).toHaveLength(2);
      });
      fireEvent.click(screen.getAllByTestId('workflow-template-card')[0]);

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
        expect.stringContaining('/api/argo/workflows/data-processing-abc12')
      );
    });

    it('should not show workflow-detail-page when on templates tab', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      renderArgoTab();

      // Assert: templates tab is default; no detail view
      expect(screen.queryByTestId('workflow-detail-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('workflow-templates-page')).toBeInTheDocument();
    });
  });
});
