import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { WorkflowDetail } from './WorkflowDetail';

// ---------------------------------------------------------------------------
// Mock the API module so we control fetchWorkflowDetail
// ---------------------------------------------------------------------------
vi.mock('../api/argo', () => ({
  fetchWorkflowDetail: vi.fn(),
}));

import { fetchWorkflowDetail } from '../api/argo';
const mockFetchWorkflowDetail = fetchWorkflowDetail as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const mockWorkflowDetail = {
  name: 'data-processing-abc12',
  namespace: 'dashboard-test',
  phase: 'Succeeded',
  templateName: 'data-processing-with-params',
  startedAt: '2026-02-22T08:00:00Z',
  finishedAt: '2026-02-22T09:00:00Z',
  nodes: [
    {
      name: 'step-1',
      phase: 'Succeeded',
      startedAt: '2026-02-22T08:00:00Z',
      finishedAt: '2026-02-22T08:30:00Z',
      message: '',
      inputs: {
        parameters: [
          { name: 'input-path', value: '/data/input' },
          { name: 'batch-size', value: '100' },
        ],
        artifacts: [],
      },
      outputs: {
        parameters: [{ name: 'record-count', value: '42' }],
        artifacts: [{ name: 'result-file', path: '/output/result.csv' }],
      },
    },
    {
      name: 'step-2',
      phase: 'Succeeded',
      startedAt: '2026-02-22T08:30:00Z',
      finishedAt: '2026-02-22T09:00:00Z',
      message: 'completed successfully',
      inputs: {
        parameters: [],
        artifacts: [{ name: 'result-file', path: '/output/result.csv' }],
      },
      outputs: {
        parameters: [],
        artifacts: [],
      },
    },
  ],
};

const mockWorkflowRunning = {
  name: 'ml-training-xyz99',
  namespace: 'production',
  phase: 'Running',
  templateName: 'ml-training',
  startedAt: '2026-02-22T10:00:00Z',
  finishedAt: '',
  nodes: [
    {
      name: 'preprocess',
      phase: 'Succeeded',
      startedAt: '2026-02-22T10:00:00Z',
      finishedAt: '2026-02-22T10:15:00Z',
      message: '',
      inputs: { parameters: [], artifacts: [] },
      outputs: { parameters: [], artifacts: [] },
    },
    {
      name: 'train',
      phase: 'Running',
      startedAt: '2026-02-22T10:15:00Z',
      finishedAt: '',
      message: 'training epoch 5/10',
      inputs: { parameters: [{ name: 'model-type', value: 'resnet' }], artifacts: [] },
      outputs: { parameters: [], artifacts: [] },
    },
  ],
};

const mockWorkflowFailed = {
  name: 'batch-job-fail01',
  namespace: 'default',
  phase: 'Failed',
  templateName: 'batch-job',
  startedAt: '2026-02-22T07:00:00Z',
  finishedAt: '2026-02-22T07:15:00Z',
  nodes: [
    {
      name: 'process',
      phase: 'Failed',
      startedAt: '2026-02-22T07:00:00Z',
      finishedAt: '2026-02-22T07:15:00Z',
      message: 'OOMKilled: container exceeded memory limit',
      inputs: { parameters: [], artifacts: [] },
      outputs: { parameters: [], artifacts: [] },
    },
  ],
};

const mockWorkflowNoNodes = {
  name: 'pending-wf-001',
  namespace: 'default',
  phase: 'Pending',
  templateName: 'simple-template',
  startedAt: '',
  finishedAt: '',
  nodes: [],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WorkflowDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  describe('Loading State', () => {
    it('should display loading skeleton while fetching workflow detail', () => {
      // Arrange: never resolves
      mockFetchWorkflowDetail.mockImplementation(() => new Promise(() => {}));

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should set aria-busy on loading skeleton', () => {
      // Arrange
      mockFetchWorkflowDetail.mockImplementation(() => new Promise(() => {}));

      // Act
      render(
        <WorkflowDetail
          namespace="default"
          name="my-workflow"
          onBack={vi.fn()}
        />
      );

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('should hide loading skeleton after data is loaded', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  describe('Error State', () => {
    it('should display error retry component when fetch fails', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(
        <WorkflowDetail
          namespace="default"
          name="my-workflow"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        const errorRetry = screen.getByTestId('error-retry');
        expect(errorRetry).toBeInTheDocument();
      });
    });

    it('should set role="alert" on error component', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(
        <WorkflowDetail
          namespace="default"
          name="my-workflow"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        const errorRetry = screen.getByTestId('error-retry');
        expect(errorRetry).toHaveAttribute('role', 'alert');
      });
    });

    it('should not render detail content on error', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockRejectedValueOnce(new Error('Not found'));

      // Act
      render(
        <WorkflowDetail
          namespace="default"
          name="my-workflow"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('error-retry')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('workflow-detail-header')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Header card
  // -------------------------------------------------------------------------

  describe('Header Card', () => {
    it('should render workflow detail header card', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        const header = screen.getByTestId('workflow-detail-header');
        expect(header).toBeInTheDocument();
      });
    });

    it('should display workflow name in header', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-name')).toHaveTextContent('data-processing-abc12');
      });
    });

    it('should display workflow phase in header', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-phase')).toHaveTextContent('Succeeded');
      });
    });

    it('should display template name in header', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-template')).toHaveTextContent(
          'data-processing-with-params'
        );
      });
    });

    it('should display namespace in header', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-namespace')).toHaveTextContent('dashboard-test');
      });
    });

    it('should display start time in header', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        const startedAt = screen.getByTestId('workflow-detail-started-at');
        expect(startedAt).toBeInTheDocument();
      });
    });

    it('should apply green color class for Succeeded phase', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        const phase = screen.getByTestId('workflow-detail-phase');
        expect(phase.className).toMatch(/green/i);
      });
    });

    it('should apply blue color class for Running phase', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowRunning);

      // Act
      render(
        <WorkflowDetail
          namespace="production"
          name="ml-training-xyz99"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        const phase = screen.getByTestId('workflow-detail-phase');
        expect(phase.className).toMatch(/blue/i);
      });
    });

    it('should apply red color class for Failed phase', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowFailed);

      // Act
      render(
        <WorkflowDetail
          namespace="default"
          name="batch-job-fail01"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        const phase = screen.getByTestId('workflow-detail-phase');
        expect(phase.className).toMatch(/red/i);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Back navigation
  // -------------------------------------------------------------------------

  describe('Back Navigation', () => {
    it('should render a back button', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert: back button should be present even during loading
      const backButton = screen.getByTestId('workflow-detail-back-button');
      expect(backButton).toBeInTheDocument();
    });

    it('should call onBack when back button is clicked', async () => {
      // Arrange
      const onBack = vi.fn();
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={onBack}
        />
      );

      // Act
      fireEvent.click(screen.getByTestId('workflow-detail-back-button'));

      // Assert
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Parameters toggle
  // -------------------------------------------------------------------------

  describe('Parameters Toggle', () => {
    it('should render parameters toggle button', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        const toggle = screen.getByTestId('workflow-detail-params-toggle');
        expect(toggle).toBeInTheDocument();
      });
    });

    it('should hide parameters panel by default', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-params-toggle')).toBeInTheDocument();
      });

      // Assert: panel should be hidden before toggling
      expect(screen.queryByTestId('workflow-detail-params-list')).not.toBeInTheDocument();
    });

    it('should show parameters panel when toggle is clicked', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-params-toggle')).toBeInTheDocument();
      });

      // Act
      fireEvent.click(screen.getByTestId('workflow-detail-params-toggle'));

      // Assert
      await waitFor(() => {
        const panel = screen.getByTestId('workflow-detail-params-list');
        expect(panel).toBeInTheDocument();
      });
    });

    it('should hide parameters panel when toggle is clicked again', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-params-toggle')).toBeInTheDocument();
      });

      // Act: open then close
      fireEvent.click(screen.getByTestId('workflow-detail-params-toggle'));
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-params-list')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('workflow-detail-params-toggle'));

      // Assert
      await waitFor(() => {
        expect(screen.queryByTestId('workflow-detail-params-list')).not.toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Steps timeline
  // -------------------------------------------------------------------------

  describe('Steps Timeline', () => {
    it('should render the steps timeline container', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        const timeline = screen.getByTestId('workflow-detail-steps-timeline');
        expect(timeline).toBeInTheDocument();
      });
    });

    it('should render one timeline item per node', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        const items = screen.getAllByTestId('workflow-detail-step');
        expect(items).toHaveLength(2);
      });
    });

    it('should display node names in the timeline', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText('step-1')).toBeInTheDocument();
        expect(screen.getByText('step-2')).toBeInTheDocument();
      });
    });

    it('should display node phase badges in the timeline', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        const phases = screen.getAllByTestId('workflow-detail-step-phase');
        expect(phases).toHaveLength(2);
        phases.forEach((p) => expect(p).toHaveTextContent('Succeeded'));
      });
    });

    it('should display node message when present', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert: step-2 has message "completed successfully"
      await waitFor(() => {
        expect(screen.getByText('completed successfully')).toBeInTheDocument();
      });
    });

    it('should render empty timeline when nodes array is empty', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowNoNodes);

      // Act
      render(
        <WorkflowDetail
          namespace="default"
          name="pending-wf-001"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        const timeline = screen.getByTestId('workflow-detail-steps-timeline');
        expect(timeline).toBeInTheDocument();
      });

      const items = screen.queryAllByTestId('workflow-detail-step');
      expect(items).toHaveLength(0);
    });

    it('should render Running and Succeeded nodes with distinct phase indicators', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowRunning);

      // Act
      render(
        <WorkflowDetail
          namespace="production"
          name="ml-training-xyz99"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        const phases = screen.getAllByTestId('workflow-detail-step-phase');
        expect(phases).toHaveLength(2);
        expect(phases[0]).toHaveTextContent('Succeeded');
        expect(phases[1]).toHaveTextContent('Running');
      });
    });
  });

  // -------------------------------------------------------------------------
  // API integration
  // -------------------------------------------------------------------------

  describe('API Integration', () => {
    it('should call fetchWorkflowDetail with correct namespace and name', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        expect(mockFetchWorkflowDetail).toHaveBeenCalledWith(
          'dashboard-test',
          'data-processing-abc12'
        );
      });
    });

    it('should call fetchWorkflowDetail exactly once on mount', async () => {
      // Arrange
      mockFetchWorkflowDetail.mockResolvedValueOnce(mockWorkflowDetail);

      // Act
      render(
        <WorkflowDetail
          namespace="dashboard-test"
          name="data-processing-abc12"
          onBack={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-header')).toBeInTheDocument();
      });

      // Assert
      expect(mockFetchWorkflowDetail).toHaveBeenCalledTimes(1);
    });
  });
});
