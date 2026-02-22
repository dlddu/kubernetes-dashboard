import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepIO } from './StepIO';

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const mockInputsWithParams = {
  parameters: [
    { name: 'input-path', value: '/data/input' },
    { name: 'batch-size', value: '100' },
    { name: 'env', value: 'prod' },
  ],
  artifacts: [],
};

const mockOutputsWithArtifacts = {
  parameters: [{ name: 'record-count', value: '42' }],
  artifacts: [
    { name: 'result-file', path: '/output/result.csv' },
    { name: 'metrics', path: '/output/metrics.json' },
  ],
};

const mockInputsWithArtifacts = {
  parameters: [],
  artifacts: [{ name: 'input-data', path: '/data/raw.csv' }],
};

const mockEmptyIO = {
  parameters: [],
  artifacts: [],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StepIO Component', () => {
  // -------------------------------------------------------------------------
  // Basic rendering
  // -------------------------------------------------------------------------

  describe('Basic Rendering', () => {
    it('should render the IO toggle button when step has inputs', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockEmptyIO}
        />
      );

      // Assert
      const toggle = screen.getByTestId('workflow-detail-step-io-toggle');
      expect(toggle).toBeInTheDocument();
    });

    it('should render inputs panel when toggle is clicked', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockEmptyIO}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert
      const inputsPanel = screen.getByTestId('workflow-detail-step-inputs-panel');
      expect(inputsPanel).toBeInTheDocument();
    });

    it('should render outputs panel when toggle is clicked', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockEmptyIO}
          outputs={mockOutputsWithArtifacts}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert
      const outputsPanel = screen.getByTestId('workflow-detail-step-outputs-panel');
      expect(outputsPanel).toBeInTheDocument();
    });

    it('should display "Inputs" label in inputs panel', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockEmptyIO}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert
      const inputsPanel = screen.getByTestId('workflow-detail-step-inputs-panel');
      expect(inputsPanel).toHaveTextContent(/inputs/i);
    });

    it('should display "Outputs" label in outputs panel', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockEmptyIO}
          outputs={mockOutputsWithArtifacts}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert
      const outputsPanel = screen.getByTestId('workflow-detail-step-outputs-panel');
      expect(outputsPanel).toHaveTextContent(/outputs/i);
    });
  });

  // -------------------------------------------------------------------------
  // Color scheme
  // -------------------------------------------------------------------------

  describe('Color Scheme', () => {
    it('should apply purple color class to inputs panel', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockEmptyIO}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert
      const inputsPanel = screen.getByTestId('workflow-detail-step-inputs-panel');
      expect(inputsPanel.className).toMatch(/purple/i);
    });

    it('should apply green color class to outputs panel', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockEmptyIO}
          outputs={mockOutputsWithArtifacts}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert
      const outputsPanel = screen.getByTestId('workflow-detail-step-outputs-panel');
      expect(outputsPanel.className).toMatch(/green/i);
    });
  });

  // -------------------------------------------------------------------------
  // Parameters display
  // -------------------------------------------------------------------------

  describe('Parameters Display', () => {
    it('should render input parameter names and values', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockEmptyIO}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert
      expect(screen.getByText('input-path')).toBeInTheDocument();
      expect(screen.getByText('/data/input')).toBeInTheDocument();
      expect(screen.getByText('batch-size')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should render correct number of input parameter items', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockEmptyIO}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert: mockInputsWithParams has 3 parameters (inputs panel)
      const inputsPanel = screen.getByTestId('workflow-detail-step-inputs-panel');
      const paramItems = inputsPanel.querySelectorAll('[data-testid="workflow-detail-io-param"]');
      expect(paramItems).toHaveLength(3);
    });

    it('should render output parameter names and values', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockEmptyIO}
          outputs={mockOutputsWithArtifacts}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert
      expect(screen.getByText('record-count')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render correct number of output parameter items', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockEmptyIO}
          outputs={mockOutputsWithArtifacts}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert: mockOutputsWithArtifacts has 1 parameter (outputs panel)
      const outputsPanel = screen.getByTestId('workflow-detail-step-outputs-panel');
      const paramItems = outputsPanel.querySelectorAll('[data-testid="workflow-detail-io-param"]');
      expect(paramItems).toHaveLength(1);
    });

    it('should not render parameter items when parameters array is empty', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockEmptyIO}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert: inputs panel has 3 params, outputs panel has 0 params
      const outputsPanel = screen.getByTestId('workflow-detail-step-outputs-panel');
      const outputParams = outputsPanel.querySelectorAll('[data-testid="workflow-detail-io-param"]');
      expect(outputParams).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Artifacts display
  // -------------------------------------------------------------------------

  describe('Artifacts Display', () => {
    it('should render input artifact names and paths', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithArtifacts}
          outputs={mockEmptyIO}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert
      expect(screen.getByText('input-data')).toBeInTheDocument();
      expect(screen.getByText('/data/raw.csv')).toBeInTheDocument();
    });

    it('should render correct number of input artifact items', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithArtifacts}
          outputs={mockEmptyIO}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert: mockInputsWithArtifacts has 1 artifact (inputs panel)
      const inputsPanel = screen.getByTestId('workflow-detail-step-inputs-panel');
      const artifactItems = inputsPanel.querySelectorAll('[data-testid="workflow-detail-io-artifact"]');
      expect(artifactItems).toHaveLength(1);
    });

    it('should render output artifact names and paths', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockEmptyIO}
          outputs={mockOutputsWithArtifacts}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert
      expect(screen.getByText('result-file')).toBeInTheDocument();
      expect(screen.getByText('/output/result.csv')).toBeInTheDocument();
    });

    it('should render correct number of output artifact items', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockEmptyIO}
          outputs={mockOutputsWithArtifacts}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert: mockOutputsWithArtifacts has 2 artifacts (outputs panel)
      const outputsPanel = screen.getByTestId('workflow-detail-step-outputs-panel');
      const artifactItems = outputsPanel.querySelectorAll('[data-testid="workflow-detail-io-artifact"]');
      expect(artifactItems).toHaveLength(2);
    });

    it('should not render artifact items when artifacts array is empty', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockEmptyIO}
        />
      );

      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert: mockInputsWithParams has no artifacts
      const inputsPanel = screen.getByTestId('workflow-detail-step-inputs-panel');
      const outputsPanel = screen.getByTestId('workflow-detail-step-outputs-panel');
      const inputArtifacts = inputsPanel.querySelectorAll('[data-testid="workflow-detail-io-artifact"]');
      const outputArtifacts = outputsPanel.querySelectorAll('[data-testid="workflow-detail-io-artifact"]');
      expect(inputArtifacts).toHaveLength(0);
      expect(outputArtifacts).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Toggle behavior
  // -------------------------------------------------------------------------

  describe('Toggle Behavior', () => {
    it('should render an IO toggle button for the step', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockOutputsWithArtifacts}
        />
      );

      // Assert
      const toggle = screen.getByTestId('workflow-detail-step-io-toggle');
      expect(toggle).toBeInTheDocument();
    });

    it('should hide IO panels by default (collapsed state)', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockOutputsWithArtifacts}
        />
      );

      // Assert: panels should not be visible before toggling
      expect(screen.queryByTestId('workflow-detail-step-inputs-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('workflow-detail-step-outputs-panel')).not.toBeInTheDocument();
    });

    it('should show IO panels when toggle is clicked', () => {
      // Arrange
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockOutputsWithArtifacts}
        />
      );

      // Act
      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert
      expect(screen.getByTestId('workflow-detail-step-inputs-panel')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-detail-step-outputs-panel')).toBeInTheDocument();
    });

    it('should hide IO panels when toggle is clicked again (close)', () => {
      // Arrange
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockOutputsWithArtifacts}
        />
      );

      // Act: open then close
      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));
      expect(screen.getByTestId('workflow-detail-step-inputs-panel')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert
      expect(screen.queryByTestId('workflow-detail-step-inputs-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('workflow-detail-step-outputs-panel')).not.toBeInTheDocument();
    });

    it('should show IO panel content after toggling open', () => {
      // Arrange
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockOutputsWithArtifacts}
        />
      );

      // Act
      fireEvent.click(screen.getByTestId('workflow-detail-step-io-toggle'));

      // Assert: parameter data should now be visible
      expect(screen.getByText('input-path')).toBeInTheDocument();
      expect(screen.getByText('/data/input')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Independent toggle per step
  // -------------------------------------------------------------------------

  describe('Independent Toggle per Step', () => {
    it('should toggle each step IO independently', () => {
      // Arrange: render two StepIO components side by side
      render(
        <div>
          <StepIO
            stepName="step-1"
            inputs={mockInputsWithParams}
            outputs={mockEmptyIO}
          />
          <StepIO
            stepName="step-2"
            inputs={mockInputsWithArtifacts}
            outputs={mockOutputsWithArtifacts}
          />
        </div>
      );

      // Act: open only the first step's IO
      const toggles = screen.getAllByTestId('workflow-detail-step-io-toggle');
      expect(toggles).toHaveLength(2);
      fireEvent.click(toggles[0]);

      // Assert: first step shows inputs panel, second step does not
      const inputPanels = screen.getAllByTestId('workflow-detail-step-inputs-panel');
      expect(inputPanels).toHaveLength(1); // only step-1 is open
    });

    it('should open both steps independently', () => {
      // Arrange
      render(
        <div>
          <StepIO
            stepName="step-1"
            inputs={mockInputsWithParams}
            outputs={mockEmptyIO}
          />
          <StepIO
            stepName="step-2"
            inputs={mockInputsWithArtifacts}
            outputs={mockOutputsWithArtifacts}
          />
        </div>
      );

      // Act: open both toggles
      const toggles = screen.getAllByTestId('workflow-detail-step-io-toggle');
      fireEvent.click(toggles[0]);
      fireEvent.click(toggles[1]);

      // Assert: both steps have inputs panels
      const inputPanels = screen.getAllByTestId('workflow-detail-step-inputs-panel');
      expect(inputPanels).toHaveLength(2);
    });

    it('should close one step without affecting the other', () => {
      // Arrange
      render(
        <div>
          <StepIO
            stepName="step-1"
            inputs={mockInputsWithParams}
            outputs={mockEmptyIO}
          />
          <StepIO
            stepName="step-2"
            inputs={mockInputsWithArtifacts}
            outputs={mockOutputsWithArtifacts}
          />
        </div>
      );

      // Act: open both, then close the first
      const toggles = screen.getAllByTestId('workflow-detail-step-io-toggle');
      fireEvent.click(toggles[0]);
      fireEvent.click(toggles[1]);
      fireEvent.click(toggles[0]); // close step-1

      // Assert: only step-2 still has an open panel
      const inputPanels = screen.getAllByTestId('workflow-detail-step-inputs-panel');
      expect(inputPanels).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Empty state — no IO data means no render
  // -------------------------------------------------------------------------

  describe('Empty State', () => {
    it('should render nothing when both inputs and outputs are empty', () => {
      // Arrange & Act
      const { container } = render(
        <StepIO
          stepName="empty-step"
          inputs={mockEmptyIO}
          outputs={mockEmptyIO}
        />
      );

      // Assert: no IO toggle should be rendered
      expect(screen.queryByTestId('workflow-detail-step-io-toggle')).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });

    it('should not render IO toggle when inputs and outputs are null', () => {
      // Arrange
      render(
        <StepIO
          stepName="null-step"
          inputs={null}
          outputs={null}
        />
      );

      // Assert
      expect(screen.queryByTestId('workflow-detail-step-io-toggle')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Props handling
  // -------------------------------------------------------------------------

  describe('Props Handling', () => {
    it('should render null inputs gracefully when outputs has data', () => {
      // Arrange & Act: null inputs should not crash the component
      expect(() =>
        render(
          <StepIO
            stepName="step-null"
            inputs={null}
            outputs={mockOutputsWithArtifacts}
          />
        )
      ).not.toThrow();
    });

    it('should render null outputs gracefully when inputs has data', () => {
      // Arrange & Act
      expect(() =>
        render(
          <StepIO
            stepName="step-null"
            inputs={mockInputsWithParams}
            outputs={null}
          />
        )
      ).not.toThrow();
    });

    it('should render both null inputs and outputs gracefully (no crash)', () => {
      // Arrange & Act
      expect(() =>
        render(
          <StepIO
            stepName="step-null"
            inputs={null}
            outputs={null}
          />
        )
      ).not.toThrow();
    });

    it('should use stepName to uniquely identify the toggle aria-controls', () => {
      // Arrange
      render(
        <div>
          <StepIO stepName="alpha" inputs={mockInputsWithParams} outputs={mockEmptyIO} />
          <StepIO stepName="beta" inputs={mockInputsWithParams} outputs={mockEmptyIO} />
        </div>
      );

      // Act: click both toggles
      const toggles = screen.getAllByTestId('workflow-detail-step-io-toggle');
      expect(toggles).toHaveLength(2);
      fireEvent.click(toggles[0]);
      fireEvent.click(toggles[1]);

      // Assert: both panels appear independently
      expect(screen.getAllByTestId('workflow-detail-step-inputs-panel')).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should make toggle button keyboard-accessible', () => {
      // Arrange & Act
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockOutputsWithArtifacts}
        />
      );

      // Assert: the toggle should be a button element
      const toggle = screen.getByTestId('workflow-detail-step-io-toggle');
      expect(toggle.tagName).toBe('BUTTON');
    });

    it('should have accessible aria-expanded attribute on toggle', () => {
      // Arrange
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockOutputsWithArtifacts}
        />
      );

      // Assert: collapsed state
      const toggle = screen.getByTestId('workflow-detail-step-io-toggle');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      // Act: open
      fireEvent.click(toggle);

      // Assert: expanded state
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    it('should revert aria-expanded to false when closed', () => {
      // Arrange
      render(
        <StepIO
          stepName="step-1"
          inputs={mockInputsWithParams}
          outputs={mockOutputsWithArtifacts}
        />
      );

      const toggle = screen.getByTestId('workflow-detail-step-io-toggle');

      // Act: open then close
      fireEvent.click(toggle);
      fireEvent.click(toggle);

      // Assert
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
