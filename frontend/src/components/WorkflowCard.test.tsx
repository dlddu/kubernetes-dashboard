import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowCard } from './WorkflowCard';

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const mockWorkflowRunning = {
  name: 'data-processing-abc12',
  namespace: 'dashboard-test',
  templateName: 'data-processing-with-params',
  phase: 'Running',
  startedAt: '2026-02-22T10:00:00Z',
  finishedAt: '',
  nodes: [
    { name: 'step-1', phase: 'Succeeded' },
    { name: 'step-2', phase: 'Running' },
  ],
};

const mockWorkflowSucceeded = {
  name: 'ml-training-xyz99',
  namespace: 'production',
  templateName: 'ml-training',
  phase: 'Succeeded',
  startedAt: '2026-02-22T08:00:00Z',
  finishedAt: '2026-02-22T09:30:00Z',
  nodes: [
    { name: 'preprocess', phase: 'Succeeded' },
    { name: 'train', phase: 'Succeeded' },
    { name: 'evaluate', phase: 'Succeeded' },
  ],
};

const mockWorkflowFailed = {
  name: 'batch-job-fail01',
  namespace: 'default',
  templateName: 'batch-job',
  phase: 'Failed',
  startedAt: '2026-02-22T07:00:00Z',
  finishedAt: '2026-02-22T07:15:00Z',
  nodes: [
    { name: 'init', phase: 'Succeeded' },
    { name: 'process', phase: 'Failed' },
  ],
};

const mockWorkflowPending = {
  name: 'pending-workflow-001',
  namespace: 'default',
  templateName: 'simple-template',
  phase: 'Pending',
  startedAt: '',
  finishedAt: '',
  nodes: [],
};

const mockWorkflowNoNodes = {
  name: 'empty-nodes-wf',
  namespace: 'default',
  templateName: 'simple-template',
  phase: 'Running',
  startedAt: '2026-02-22T11:00:00Z',
  finishedAt: '',
  nodes: [],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WorkflowCard Component', () => {
  describe('Basic Rendering', () => {
    it('should render workflow run card container', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowRunning} />);

      // Assert
      const card = screen.getByTestId('workflow-run-card');
      expect(card).toBeInTheDocument();
    });

    it('should display workflow name', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowRunning} />);

      // Assert
      const name = screen.getByTestId('workflow-run-name');
      expect(name).toBeInTheDocument();
      expect(name).toHaveTextContent('data-processing-abc12');
    });

    it('should display workflow phase badge', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowRunning} />);

      // Assert
      const phase = screen.getByTestId('workflow-run-phase');
      expect(phase).toBeInTheDocument();
      expect(phase).toHaveTextContent('Running');
    });

    it('should display template name', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowRunning} />);

      // Assert
      const templateName = screen.getByTestId('workflow-run-template');
      expect(templateName).toBeInTheDocument();
      expect(templateName).toHaveTextContent('data-processing-with-params');
    });

    it('should display start time', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowRunning} />);

      // Assert
      const time = screen.getByTestId('workflow-run-time');
      expect(time).toBeInTheDocument();
    });

    it('should render steps preview area', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowRunning} />);

      // Assert
      const stepsPreview = screen.getByTestId('workflow-run-steps-preview');
      expect(stepsPreview).toBeInTheDocument();
    });
  });

  describe('Phase Badge Colors', () => {
    it('should apply blue color class for Running phase', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowRunning} />);

      // Assert
      const phase = screen.getByTestId('workflow-run-phase');
      // The badge element should carry a blue-related class
      expect(phase.className).toMatch(/blue/i);
    });

    it('should apply green color class for Succeeded phase', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowSucceeded} />);

      // Assert
      const phase = screen.getByTestId('workflow-run-phase');
      expect(phase.className).toMatch(/green/i);
    });

    it('should apply red color class for Failed phase', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowFailed} />);

      // Assert
      const phase = screen.getByTestId('workflow-run-phase');
      expect(phase.className).toMatch(/red/i);
    });

    it('should apply yellow color class for Pending phase', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowPending} />);

      // Assert
      const phase = screen.getByTestId('workflow-run-phase');
      expect(phase.className).toMatch(/yellow/i);
    });
  });

  describe('Steps Preview', () => {
    it('should render individual step elements', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowRunning} />);

      // Assert
      const steps = screen.getAllByTestId('workflow-run-step');
      expect(steps).toHaveLength(2);
    });

    it('should render step icons', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowRunning} />);

      // Assert
      const icons = screen.getAllByTestId('workflow-run-step-icon');
      expect(icons).toHaveLength(2);
    });

    it('should render step names', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowRunning} />);

      // Assert
      const names = screen.getAllByTestId('workflow-run-step-name');
      expect(names).toHaveLength(2);
      expect(names[0]).toHaveTextContent('step-1');
      expect(names[1]).toHaveTextContent('step-2');
    });

    it('should render arrows between steps', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowRunning} />);

      // Assert: 2 steps => 1 arrow between them
      const arrows = screen.getAllByTestId('workflow-run-step-arrow');
      expect(arrows).toHaveLength(1);
      expect(arrows[0]).toHaveTextContent('→');
    });

    it('should render correct number of arrows for three steps', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowSucceeded} />);

      // Assert: 3 steps => 2 arrows
      const arrows = screen.getAllByTestId('workflow-run-step-arrow');
      expect(arrows).toHaveLength(2);
    });

    it('should render no steps when nodes array is empty', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowNoNodes} />);

      // Assert
      const steps = screen.queryAllByTestId('workflow-run-step');
      expect(steps).toHaveLength(0);
    });

    it('should render no arrows when there is only one step', () => {
      // Arrange
      const singleStepWorkflow = {
        ...mockWorkflowRunning,
        nodes: [{ name: 'only-step', phase: 'Running' }],
      };

      // Act
      render(<WorkflowCard {...singleStepWorkflow} />);

      // Assert
      const arrows = screen.queryAllByTestId('workflow-run-step-arrow');
      expect(arrows).toHaveLength(0);
    });

    it('should render no arrows when nodes array is empty', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowNoNodes} />);

      // Assert
      const arrows = screen.queryAllByTestId('workflow-run-step-arrow');
      expect(arrows).toHaveLength(0);
    });
  });

  describe('Click Interaction', () => {
    it('should call onSelect callback when card is clicked', () => {
      // Arrange
      const onSelect = vi.fn();
      render(<WorkflowCard {...mockWorkflowRunning} onSelect={onSelect} />);
      const card = screen.getByTestId('workflow-run-card');

      // Act
      fireEvent.click(card);

      // Assert
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('should pass the workflow object to onSelect callback', () => {
      // Arrange
      const onSelect = vi.fn();
      render(<WorkflowCard {...mockWorkflowRunning} onSelect={onSelect} />);
      const card = screen.getByTestId('workflow-run-card');

      // Act
      fireEvent.click(card);

      // Assert
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'data-processing-abc12',
          namespace: 'dashboard-test',
          phase: 'Running',
        })
      );
    });

    it('should not throw when onSelect is not provided', () => {
      // Arrange
      render(<WorkflowCard {...mockWorkflowRunning} />);
      const card = screen.getByTestId('workflow-run-card');

      // Act & Assert: clicking without onSelect should not crash
      expect(() => fireEvent.click(card)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should render correctly for a succeeded workflow with finishedAt', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowSucceeded} />);

      // Assert: card, name, phase, and time should all be present
      expect(screen.getByTestId('workflow-run-card')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-run-name')).toHaveTextContent('ml-training-xyz99');
      expect(screen.getByTestId('workflow-run-phase')).toHaveTextContent('Succeeded');
    });

    it('should render correctly when startedAt is empty', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowPending} />);

      // Assert: card should render without crashing
      expect(screen.getByTestId('workflow-run-card')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-run-time')).toBeInTheDocument();
    });

    it('should handle workflow names with hyphens', () => {
      // Arrange
      const workflow = {
        ...mockWorkflowRunning,
        name: 'my-long-workflow-name-abc123',
      };

      // Act
      render(<WorkflowCard {...workflow} />);

      // Assert
      expect(screen.getByTestId('workflow-run-name')).toHaveTextContent(
        'my-long-workflow-name-abc123'
      );
    });

    it('should handle template names with hyphens', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowRunning} />);

      // Assert
      expect(screen.getByTestId('workflow-run-template')).toHaveTextContent(
        'data-processing-with-params'
      );
    });

    it('should be accessible: card and name should be visible', () => {
      // Arrange & Act
      render(<WorkflowCard {...mockWorkflowRunning} />);

      // Assert
      expect(screen.getByTestId('workflow-run-card')).toBeVisible();
      expect(screen.getByTestId('workflow-run-name')).toBeVisible();
    });
  });
});
