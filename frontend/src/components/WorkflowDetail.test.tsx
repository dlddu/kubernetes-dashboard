/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { WorkflowDetail } from './WorkflowDetail';

// ---------------------------------------------------------------------------
// Mock fetch API
// ---------------------------------------------------------------------------

global.fetch = vi.fn();

// ---------------------------------------------------------------------------
// Fixture data
//
// TDD Red Phase: WorkflowDetail component is not yet implemented.
// These fixtures mirror the data shapes defined in the e2e spec.
// ---------------------------------------------------------------------------

const mockArtifactInput = {
  name: 'raw-data',
  path: '/data/raw',
  from: 's3://bucket/raw',
};

const mockArtifactOutput = {
  name: 'processed-data',
  path: '/data/processed',
  size: '1.2MB',
};

const mockDetailRunning = {
  name: 'data-processing-running',
  namespace: 'dashboard-test',
  templateName: 'data-processing',
  phase: 'Running',
  startedAt: '2026-02-22T07:00:00Z',
  finishedAt: '',
  parameters: [{ name: 'input-path', value: '/data/input' }],
  nodes: [
    {
      name: 'step-one',
      phase: 'Succeeded',
      startedAt: '2026-02-22T07:00:10Z',
      finishedAt: '2026-02-22T07:05:00Z',
      message: '',
      inputs: {
        parameters: [{ name: 'input-path', value: '/data/input' }],
        artifacts: [],
      },
      outputs: {
        parameters: [{ name: 'result', value: 'done' }],
        artifacts: [],
      },
    },
    {
      name: 'step-two',
      phase: 'Running',
      startedAt: '2026-02-22T07:05:10Z',
      finishedAt: '',
      message: 'Processing batch 42/100',
      inputs: {
        parameters: [{ name: 'input-path', value: '/data/output' }],
        artifacts: [],
      },
      outputs: {
        parameters: [],
        artifacts: [],
      },
    },
    {
      name: 'step-three',
      phase: 'Pending',
      startedAt: '',
      finishedAt: '',
      message: '',
      inputs: { parameters: [], artifacts: [] },
      outputs: { parameters: [], artifacts: [] },
    },
  ],
};

const mockDetailFailed = {
  name: 'data-processing-failed',
  namespace: 'dashboard-test',
  templateName: 'data-processing',
  phase: 'Failed',
  startedAt: '2026-02-22T05:00:00Z',
  finishedAt: '2026-02-22T05:45:00Z',
  parameters: [{ name: 'input-path', value: '/data/input' }],
  nodes: [
    {
      name: 'step-one',
      phase: 'Succeeded',
      startedAt: '2026-02-22T05:00:10Z',
      finishedAt: '2026-02-22T05:20:00Z',
      message: '',
      inputs: {
        parameters: [{ name: 'input-path', value: '/data/input' }],
        artifacts: [mockArtifactInput],
      },
      outputs: {
        parameters: [{ name: 'result', value: 'done' }],
        artifacts: [mockArtifactOutput],
      },
    },
    {
      name: 'step-two',
      phase: 'Failed',
      startedAt: '2026-02-22T05:20:10Z',
      finishedAt: '2026-02-22T05:45:00Z',
      message: 'Health check failed...',
      inputs: {
        parameters: [{ name: 'input-path', value: '/data/output' }],
        artifacts: [],
      },
      outputs: { parameters: [], artifacts: [] },
    },
    {
      name: 'step-three',
      phase: 'Omitted',
      startedAt: '',
      finishedAt: '',
      message: '',
      inputs: { parameters: [], artifacts: [] },
      outputs: { parameters: [], artifacts: [] },
    },
  ],
};

const mockDetailNoParams = {
  name: 'simple-workflow',
  namespace: 'default',
  templateName: 'simple-template',
  phase: 'Succeeded',
  startedAt: '2026-02-22T08:00:00Z',
  finishedAt: '2026-02-22T08:30:00Z',
  parameters: [],
  nodes: [
    {
      name: 'only-step',
      phase: 'Succeeded',
      startedAt: '2026-02-22T08:00:05Z',
      finishedAt: '2026-02-22T08:30:00Z',
      message: '',
      inputs: { parameters: [], artifacts: [] },
      outputs: { parameters: [], artifacts: [] },
    },
  ],
};

// ---------------------------------------------------------------------------
// Helper: mock fetch to return a given workflow detail
// ---------------------------------------------------------------------------

function mockFetchResolves(detail: object) {
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    json: async () => detail,
  });
}

function mockFetchRejects(message = 'Network error') {
  (global.fetch as any).mockRejectedValueOnce(new Error(message));
}

function mockFetchError(status: number) {
  (global.fetch as any).mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ error: `HTTP error! status: ${status}` }),
  });
}

function mockFetchPending() {
  (global.fetch as any).mockImplementationOnce(() => new Promise(() => {}));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WorkflowDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Basic Rendering
  // -------------------------------------------------------------------------

  describe('Basic Rendering', () => {
    it('should render the workflow-detail-page container', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-page')).toBeInTheDocument();
      });
    });

    it('should render the workflow name in the header', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-name')).toHaveTextContent('data-processing-running');
      });
    });

    it('should render the phase badge in the header', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const badge = screen.getByTestId('workflow-detail-phase');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent('Running');
      });
    });

    it('should render the startedAt time element', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-started-at')).toBeInTheDocument();
      });
    });

    it('should render the finishedAt time element', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-finished-at')).toBeInTheDocument();
      });
    });

    it('should render a Back to Workflows button', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const backButton = screen.getByTestId('workflow-detail-back-button');
        expect(backButton).toBeInTheDocument();
        expect(backButton).toHaveTextContent(/Back to Workflows/i);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Phase Badge Colors
  // -------------------------------------------------------------------------

  describe('Phase Badge Colors', () => {
    it('should apply blue color class for Running phase', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const badge = screen.getByTestId('workflow-detail-phase');
        expect(badge.className).toMatch(/blue/i);
      });
    });

    it('should apply green color class for Succeeded phase', async () => {
      // Arrange
      mockFetchResolves(mockDetailNoParams);

      // Act
      render(<WorkflowDetail workflowName="simple-workflow" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const badge = screen.getByTestId('workflow-detail-phase');
        expect(badge.className).toMatch(/green/i);
      });
    });

    it('should apply red color class for Failed phase', async () => {
      // Arrange
      mockFetchResolves(mockDetailFailed);

      // Act
      render(<WorkflowDetail workflowName="data-processing-failed" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const badge = screen.getByTestId('workflow-detail-phase');
        expect(badge.className).toMatch(/red/i);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Parameters Toggle
  // -------------------------------------------------------------------------

  describe('Parameters Toggle', () => {
    it('should render the parameters toggle button', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-params-toggle')).toBeInTheDocument();
      });
    });

    it('should hide the parameters list by default (collapsed)', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert: params list must be present in DOM but not visible (collapsed)
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-params-toggle')).toBeInTheDocument();
      });

      const paramsList = screen.queryByTestId('workflow-detail-params-list');
      // Either not in DOM or not visible when collapsed
      if (paramsList) {
        expect(paramsList).not.toBeVisible();
      } else {
        // paramsList not rendered at all is also valid collapsed state
        expect(paramsList).toBeNull();
      }
    });

    it('should expand the parameters list when the toggle is clicked', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-params-toggle')).toBeInTheDocument();
      });

      // Act
      fireEvent.click(screen.getByTestId('workflow-detail-params-toggle'));

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-params-list')).toBeVisible();
      });
    });

    it('should collapse the parameters list when the toggle is clicked again', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-params-toggle')).toBeInTheDocument();
      });

      // Act: expand then collapse
      fireEvent.click(screen.getByTestId('workflow-detail-params-toggle'));
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-params-list')).toBeVisible();
      });
      fireEvent.click(screen.getByTestId('workflow-detail-params-toggle'));

      // Assert: list is hidden again
      const paramsList = screen.queryByTestId('workflow-detail-params-list');
      if (paramsList) {
        expect(paramsList).not.toBeVisible();
      } else {
        expect(paramsList).toBeNull();
      }
    });

    it('should render parameter items when expanded', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-params-toggle')).toBeInTheDocument();
      });

      // Act
      fireEvent.click(screen.getByTestId('workflow-detail-params-toggle'));

      // Assert
      await waitFor(() => {
        const paramItems = screen.getAllByTestId('workflow-detail-param-item');
        expect(paramItems.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should display parameter name and value in each param item', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-params-toggle')).toBeInTheDocument();
      });

      // Act
      fireEvent.click(screen.getByTestId('workflow-detail-params-toggle'));

      // Assert: input-path=/data/input from fixture
      await waitFor(() => {
        const firstParam = screen.getAllByTestId('workflow-detail-param-item')[0];
        expect(firstParam).toHaveTextContent('input-path');
        expect(firstParam).toHaveTextContent('/data/input');
      });
    });
  });

  // -------------------------------------------------------------------------
  // Steps Timeline
  // -------------------------------------------------------------------------

  describe('Steps Timeline', () => {
    it('should render the steps timeline section', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-steps-timeline')).toBeInTheDocument();
      });
    });

    it('should render the correct number of step entries', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert: mockDetailRunning has 3 nodes
      await waitFor(() => {
        const steps = screen.getAllByTestId('workflow-detail-step');
        expect(steps).toHaveLength(3);
      });
    });

    it('should render step names in each step entry', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const stepNames = screen.getAllByTestId('workflow-detail-step-name');
        expect(stepNames).toHaveLength(3);
        expect(stepNames[0]).toHaveTextContent('step-one');
        expect(stepNames[1]).toHaveTextContent('step-two');
        expect(stepNames[2]).toHaveTextContent('step-three');
      });
    });

    it('should render phase badges in each step entry', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const phaseBadges = screen.getAllByTestId('workflow-detail-step-phase');
        expect(phaseBadges).toHaveLength(3);
        expect(phaseBadges[0]).toHaveTextContent('Succeeded');
        expect(phaseBadges[1]).toHaveTextContent('Running');
        expect(phaseBadges[2]).toHaveTextContent('Pending');
      });
    });

    it('should apply green color class to Succeeded step phase badge', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const badges = screen.getAllByTestId('workflow-detail-step-phase');
        // step-one is Succeeded → green
        expect(badges[0].className).toMatch(/green/i);
      });
    });

    it('should apply blue color class to Running step phase badge', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const badges = screen.getAllByTestId('workflow-detail-step-phase');
        // step-two is Running → blue
        expect(badges[1].className).toMatch(/blue/i);
      });
    });

    it('should apply yellow color class to Pending step phase badge', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const badges = screen.getAllByTestId('workflow-detail-step-phase');
        // step-three is Pending → yellow
        expect(badges[2].className).toMatch(/yellow/i);
      });
    });

    it('should apply red color class to Failed step phase badge', async () => {
      // Arrange
      mockFetchResolves(mockDetailFailed);

      // Act
      render(<WorkflowDetail workflowName="data-processing-failed" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const badges = screen.getAllByTestId('workflow-detail-step-phase');
        // step-two is Failed → red
        expect(badges[1].className).toMatch(/red/i);
      });
    });

    it('should render time elements in each step entry', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const times = screen.getAllByTestId('workflow-detail-step-time');
        expect(times.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Step Message
  // -------------------------------------------------------------------------

  describe('Step Message', () => {
    it('should render the step message when a step has a non-empty message', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert: step-two has message 'Processing batch 42/100'
      await waitFor(() => {
        const messages = screen.getAllByTestId('workflow-detail-step-message');
        expect(messages.length).toBeGreaterThanOrEqual(1);
        const stepTwoMessage = messages.find(el => el.textContent?.includes('Processing batch 42/100'));
        expect(stepTwoMessage).toBeInTheDocument();
      });
    });

    it('should NOT render the step message element when message is empty', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert: step-one has no message → message element should not exist for step-one
      await waitFor(() => {
        const stepElements = screen.getAllByTestId('workflow-detail-step');
        // step-one is the first element; it should have no message testid
        const stepOneMessages = stepElements[0].querySelectorAll('[data-testid="workflow-detail-step-message"]');
        expect(stepOneMessages).toHaveLength(0);
      });
    });

    it('should render error message for a failed step', async () => {
      // Arrange
      mockFetchResolves(mockDetailFailed);

      // Act
      render(<WorkflowDetail workflowName="data-processing-failed" onBack={vi.fn()} />);

      // Assert: step-two (Failed) has message 'Health check failed...'
      await waitFor(() => {
        const messages = screen.getAllByTestId('workflow-detail-step-message');
        const failMessage = messages.find(el => el.textContent?.includes('Health check failed...'));
        expect(failMessage).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // IO Toggle Visibility
  // -------------------------------------------------------------------------

  describe('IO Toggle Visibility', () => {
    it('should render the IO toggle button for steps that have inputs', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert: step-one and step-two have inputs → both should show the toggle
      await waitFor(() => {
        const stepElements = screen.getAllByTestId('workflow-detail-step');
        const stepOneToggle = stepElements[0].querySelector('[data-testid="workflow-detail-step-io-toggle"]');
        expect(stepOneToggle).toBeInTheDocument();

        const stepTwoToggle = stepElements[1].querySelector('[data-testid="workflow-detail-step-io-toggle"]');
        expect(stepTwoToggle).toBeInTheDocument();
      });
    });

    it('should display "Inputs / Outputs" text on the IO toggle button', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const toggleButtons = screen.getAllByTestId('workflow-detail-step-io-toggle');
        expect(toggleButtons[0]).toHaveTextContent(/Inputs \/ Outputs/i);
      });
    });

    it('should NOT render the IO toggle button for steps with no inputs and no outputs', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert: step-three has no inputs/outputs → no toggle
      await waitFor(() => {
        const stepElements = screen.getAllByTestId('workflow-detail-step');
        const stepThreeToggle = stepElements[2].querySelector('[data-testid="workflow-detail-step-io-toggle"]');
        expect(stepThreeToggle).toBeNull();
      });
    });

    it('should show only toggles for steps that have at least one input or output item', async () => {
      // Arrange: mockDetailRunning: step-one (has IO), step-two (has inputs), step-three (no IO)
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert: exactly 2 IO toggle buttons
      await waitFor(() => {
        const toggles = screen.getAllByTestId('workflow-detail-step-io-toggle');
        expect(toggles).toHaveLength(2);
      });
    });
  });

  // -------------------------------------------------------------------------
  // IO Panel Toggle Behavior
  // -------------------------------------------------------------------------

  describe('IO Panel Toggle Behavior', () => {
    it('should hide IO panels by default (before toggle is clicked)', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-detail-step-io-toggle')).toBeTruthy();
      });

      // Assert: IO panels should not be visible initially
      const inputsPanels = screen.queryAllByTestId('workflow-detail-step-inputs-panel');
      const outputsPanels = screen.queryAllByTestId('workflow-detail-step-outputs-panel');
      inputsPanels.forEach(panel => expect(panel).not.toBeVisible());
      outputsPanels.forEach(panel => expect(panel).not.toBeVisible());
    });

    it('should reveal IO panels when the toggle is clicked', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-detail-step-io-toggle').length).toBeGreaterThanOrEqual(1);
      });

      // Act: click first IO toggle (step-one)
      fireEvent.click(screen.getAllByTestId('workflow-detail-step-io-toggle')[0]);

      // Assert: IO panel for step-one is now visible
      await waitFor(() => {
        const stepElements = screen.getAllByTestId('workflow-detail-step');
        const panel = stepElements[0].querySelector('[data-testid="workflow-detail-step-inputs-panel"]');
        expect(panel).toBeVisible();
      });
    });

    it('should collapse IO panel when toggle is clicked again', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-detail-step-io-toggle').length).toBeGreaterThanOrEqual(1);
      });

      const firstToggle = screen.getAllByTestId('workflow-detail-step-io-toggle')[0];

      // Act: expand
      fireEvent.click(firstToggle);

      await waitFor(() => {
        const stepElements = screen.getAllByTestId('workflow-detail-step');
        const panel = stepElements[0].querySelector('[data-testid="workflow-detail-step-inputs-panel"]');
        expect(panel).toBeVisible();
      });

      // Act: collapse
      fireEvent.click(firstToggle);

      // Assert: panel hidden again
      const stepElements = screen.getAllByTestId('workflow-detail-step');
      const panel = stepElements[0].querySelector('[data-testid="workflow-detail-step-inputs-panel"]');
      if (panel) {
        expect(panel).not.toBeVisible();
      } else {
        expect(panel).toBeNull();
      }
    });

    it('should toggle each step IO panel independently', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-detail-step-io-toggle').length).toBe(2);
      });

      const toggles = screen.getAllByTestId('workflow-detail-step-io-toggle');

      // Act: click first toggle only
      fireEvent.click(toggles[0]);

      // Assert: only step-one panel is open, step-two is still closed
      await waitFor(() => {
        const stepElements = screen.getAllByTestId('workflow-detail-step');

        const stepOnePanel = stepElements[0].querySelector('[data-testid="workflow-detail-step-inputs-panel"]');
        expect(stepOnePanel).toBeVisible();

        const stepTwoPanel = stepElements[1].querySelector('[data-testid="workflow-detail-step-inputs-panel"]');
        if (stepTwoPanel) {
          expect(stepTwoPanel).not.toBeVisible();
        } else {
          expect(stepTwoPanel).toBeNull();
        }
      });
    });
  });

  // -------------------------------------------------------------------------
  // Inputs Panel Content
  // -------------------------------------------------------------------------

  describe('Inputs Panel Content', () => {
    it('should render the inputs panel with indigo/purple color class', async () => {
      // Arrange: use the failed fixture which has artifact inputs in step-one
      mockFetchResolves(mockDetailFailed);
      render(<WorkflowDetail workflowName="data-processing-failed" onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-detail-step-io-toggle').length).toBeGreaterThanOrEqual(1);
      });

      // Act: expand step-one IO
      fireEvent.click(screen.getAllByTestId('workflow-detail-step-io-toggle')[0]);

      // Assert
      await waitFor(() => {
        const stepElements = screen.getAllByTestId('workflow-detail-step');
        const inputsPanel = stepElements[0].querySelector('[data-testid="workflow-detail-step-inputs-panel"]');
        expect(inputsPanel).toBeInTheDocument();
        expect(inputsPanel?.className).toMatch(/purple|indigo/i);
      });
    });

    it('should render input parameter items (key=value format)', async () => {
      // Arrange
      mockFetchResolves(mockDetailFailed);
      render(<WorkflowDetail workflowName="data-processing-failed" onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-detail-step-io-toggle').length).toBeGreaterThanOrEqual(1);
      });

      // Act
      fireEvent.click(screen.getAllByTestId('workflow-detail-step-io-toggle')[0]);

      // Assert: input-path = /data/input
      await waitFor(() => {
        const stepElements = screen.getAllByTestId('workflow-detail-step');
        const inputsPanel = stepElements[0].querySelector('[data-testid="workflow-detail-step-inputs-panel"]');
        const paramItems = inputsPanel?.querySelectorAll('[data-testid="workflow-detail-io-param"]');
        expect(paramItems?.length).toBeGreaterThanOrEqual(1);
        expect(paramItems?.[0]).toHaveTextContent('input-path');
        expect(paramItems?.[0]).toHaveTextContent('/data/input');
      });
    });

    it('should render input artifact items with name, path, and from', async () => {
      // Arrange
      mockFetchResolves(mockDetailFailed);
      render(<WorkflowDetail workflowName="data-processing-failed" onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-detail-step-io-toggle').length).toBeGreaterThanOrEqual(1);
      });

      // Act
      fireEvent.click(screen.getAllByTestId('workflow-detail-step-io-toggle')[0]);

      // Assert: raw-data artifact at /data/raw from s3://bucket/raw
      await waitFor(() => {
        const stepElements = screen.getAllByTestId('workflow-detail-step');
        const inputsPanel = stepElements[0].querySelector('[data-testid="workflow-detail-step-inputs-panel"]');
        const artifactItems = inputsPanel?.querySelectorAll('[data-testid="workflow-detail-io-artifact"]');
        expect(artifactItems?.length).toBeGreaterThanOrEqual(1);
        expect(artifactItems?.[0]).toHaveTextContent('raw-data');
        expect(artifactItems?.[0]).toHaveTextContent('/data/raw');
        expect(artifactItems?.[0]).toHaveTextContent('s3://bucket/raw');
      });
    });
  });

  // -------------------------------------------------------------------------
  // Outputs Panel Content
  // -------------------------------------------------------------------------

  describe('Outputs Panel Content', () => {
    it('should render the outputs panel with emerald/green color class', async () => {
      // Arrange
      mockFetchResolves(mockDetailFailed);
      render(<WorkflowDetail workflowName="data-processing-failed" onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-detail-step-io-toggle').length).toBeGreaterThanOrEqual(1);
      });

      // Act: expand step-one IO
      fireEvent.click(screen.getAllByTestId('workflow-detail-step-io-toggle')[0]);

      // Assert
      await waitFor(() => {
        const stepElements = screen.getAllByTestId('workflow-detail-step');
        const outputsPanel = stepElements[0].querySelector('[data-testid="workflow-detail-step-outputs-panel"]');
        expect(outputsPanel).toBeInTheDocument();
        expect(outputsPanel?.className).toMatch(/green|emerald/i);
      });
    });

    it('should render output parameter items (key=value format)', async () => {
      // Arrange
      mockFetchResolves(mockDetailFailed);
      render(<WorkflowDetail workflowName="data-processing-failed" onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-detail-step-io-toggle').length).toBeGreaterThanOrEqual(1);
      });

      // Act
      fireEvent.click(screen.getAllByTestId('workflow-detail-step-io-toggle')[0]);

      // Assert: result = done
      await waitFor(() => {
        const stepElements = screen.getAllByTestId('workflow-detail-step');
        const outputsPanel = stepElements[0].querySelector('[data-testid="workflow-detail-step-outputs-panel"]');
        const paramItems = outputsPanel?.querySelectorAll('[data-testid="workflow-detail-io-param"]');
        expect(paramItems?.length).toBeGreaterThanOrEqual(1);
        expect(paramItems?.[0]).toHaveTextContent('result');
        expect(paramItems?.[0]).toHaveTextContent('done');
      });
    });

    it('should render output artifact items with name, path, and size', async () => {
      // Arrange
      mockFetchResolves(mockDetailFailed);
      render(<WorkflowDetail workflowName="data-processing-failed" onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('workflow-detail-step-io-toggle').length).toBeGreaterThanOrEqual(1);
      });

      // Act
      fireEvent.click(screen.getAllByTestId('workflow-detail-step-io-toggle')[0]);

      // Assert: processed-data at /data/processed with size 1.2MB
      await waitFor(() => {
        const stepElements = screen.getAllByTestId('workflow-detail-step');
        const outputsPanel = stepElements[0].querySelector('[data-testid="workflow-detail-step-outputs-panel"]');
        const artifactItems = outputsPanel?.querySelectorAll('[data-testid="workflow-detail-io-artifact"]');
        expect(artifactItems?.length).toBeGreaterThanOrEqual(1);
        expect(artifactItems?.[0]).toHaveTextContent('processed-data');
        expect(artifactItems?.[0]).toHaveTextContent('/data/processed');
        expect(artifactItems?.[0]).toHaveTextContent('1.2MB');
      });
    });
  });

  // -------------------------------------------------------------------------
  // Back Button
  // -------------------------------------------------------------------------

  describe('Back Button', () => {
    it('should call onBack callback when the back button is clicked', async () => {
      // Arrange
      const onBack = vi.fn();
      mockFetchResolves(mockDetailRunning);
      render(<WorkflowDetail workflowName="data-processing-running" onBack={onBack} />);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-back-button')).toBeInTheDocument();
      });

      // Act
      fireEvent.click(screen.getByTestId('workflow-detail-back-button'));

      // Assert
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // API Integration
  // -------------------------------------------------------------------------

  describe('API Integration', () => {
    it('should fetch from /api/argo/workflows/{name} endpoint', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/argo/workflows/data-processing-running')
        );
      });
    });

    it('should fetch with namespace query parameter when namespace prop is provided', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(
        <WorkflowDetail
          workflowName="data-processing-running"
          namespace="dashboard-test"
          onBack={vi.fn()}
        />
      );

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('ns=dashboard-test')
        );
      });
    });

    it('should fetch without namespace query parameter when namespace prop is omitted', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert: called with the base detail URL, without ?ns=
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/argo/workflows/data-processing-running'
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // Loading State
  // -------------------------------------------------------------------------

  describe('Loading State', () => {
    it('should display a loading skeleton while fetching the workflow detail', () => {
      // Arrange: fetch never resolves
      mockFetchPending();

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('should hide the loading skeleton after data is loaded', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Error State
  // -------------------------------------------------------------------------

  describe('Error State', () => {
    it('should display error retry component when fetch fails', async () => {
      // Arrange
      mockFetchRejects('Network error');

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('error-retry')).toBeInTheDocument();
      });
    });

    it('should have role="alert" on error component', async () => {
      // Arrange
      mockFetchRejects('Network error');

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('error-retry')).toHaveAttribute('role', 'alert');
      });
    });

    it('should display a retry button on error', async () => {
      // Arrange
      mockFetchRejects('Network error');

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should handle HTTP 500 error response', async () => {
      // Arrange
      mockFetchError(500);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('error-retry')).toBeInTheDocument();
      });
    });

    it('should not render workflow detail content on error', async () => {
      // Arrange
      mockFetchRejects('Network error');

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('error-retry')).toBeInTheDocument();
      });

      // The name, phase, and timeline should not be visible
      expect(screen.queryByTestId('workflow-detail-name')).not.toBeInTheDocument();
      expect(screen.queryByTestId('workflow-detail-steps-timeline')).not.toBeInTheDocument();
    });

    it('should refetch when retry button is clicked', async () => {
      // Arrange: first call fails, second succeeds
      mockFetchRejects('Network error');
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('error-retry')).toBeInTheDocument();
      });

      // Act: click retry
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      // Assert: after retry, detail is rendered
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-name')).toHaveTextContent('data-processing-running');
      });
    });
  });

  // -------------------------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------------------------

  describe('Edge Cases', () => {
    it('should render correctly when there are no parameters', async () => {
      // Arrange: mockDetailNoParams has empty parameters array
      mockFetchResolves(mockDetailNoParams);

      // Act
      render(<WorkflowDetail workflowName="simple-workflow" onBack={vi.fn()} />);

      // Assert: component renders without crash
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-page')).toBeInTheDocument();
      });
    });

    it('should render correctly when finishedAt is empty (running workflow)', async () => {
      // Arrange
      mockFetchResolves(mockDetailRunning);

      // Act
      render(<WorkflowDetail workflowName="data-processing-running" onBack={vi.fn()} />);

      // Assert: finishedAt element is present (may show '-' or similar)
      await waitFor(() => {
        expect(screen.getByTestId('workflow-detail-finished-at')).toBeInTheDocument();
      });
    });

    it('should render correctly when a workflow has only one step', async () => {
      // Arrange
      mockFetchResolves(mockDetailNoParams);

      // Act
      render(<WorkflowDetail workflowName="simple-workflow" onBack={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const steps = screen.getAllByTestId('workflow-detail-step');
        expect(steps).toHaveLength(1);
      });
    });
  });
});
