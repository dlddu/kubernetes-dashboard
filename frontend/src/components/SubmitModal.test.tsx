import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmitModal } from './SubmitModal';

// Mock the submitWorkflow API call
vi.mock('../api/argo', () => ({
  submitWorkflow: vi.fn(),
}));

import { submitWorkflow } from '../api/argo';
const mockSubmitWorkflow = submitWorkflow as ReturnType<typeof vi.fn>;

// Fixture template data matching the API response shape
const mockTemplateWithParams = {
  name: 'data-processing-with-params',
  namespace: 'dashboard-test',
  parameters: [
    { name: 'input-path', value: '/data/input' },
    { name: 'output-path', value: '/data/output' },
    { name: 'batch-size', value: '100' },
    { name: 'env', value: 'dev', enum: ['dev', 'staging', 'prod'] },
  ],
};

const mockTemplateNoParams = {
  name: 'simple-template',
  namespace: 'dashboard-test',
  parameters: [],
};

const mockTemplateEnumOnly = {
  name: 'env-template',
  namespace: 'default',
  parameters: [
    { name: 'environment', value: 'dev', enum: ['dev', 'staging', 'prod'] },
  ],
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  template: mockTemplateWithParams,
  onNavigateToWorkflows: vi.fn(),
};

describe('SubmitModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Basic Rendering
  // ---------------------------------------------------------------------------
  describe('Basic Rendering', () => {
    it('should render the modal dialog container when open', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} />);

      // Assert
      const dialog = screen.getByTestId('submit-workflow-dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toBeVisible();
    });

    it('should not render the modal dialog when closed', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} isOpen={false} />);

      // Assert
      const dialog = screen.queryByTestId('submit-workflow-dialog');
      expect(dialog).not.toBeVisible();
    });

    it('should display the confirm button', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} />);

      // Assert
      const confirmButton = screen.getByTestId('confirm-button');
      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).toBeVisible();
    });

    it('should display the cancel button', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} />);

      // Assert
      const cancelButton = screen.getByTestId('cancel-button');
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toBeVisible();
    });

    it('should display the template name in the modal', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} />);

      // Assert
      const dialog = screen.getByTestId('submit-workflow-dialog');
      expect(dialog).toHaveTextContent('data-processing-with-params');
    });
  });

  // ---------------------------------------------------------------------------
  // Parameter Input Rendering
  // ---------------------------------------------------------------------------
  describe('Parameter Inputs', () => {
    it('should render text input for a parameter without enum', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} />);

      // Assert
      const inputPathInput = screen.getByTestId('param-input-input-path');
      expect(inputPathInput).toBeInTheDocument();
      expect(inputPathInput.tagName.toLowerCase()).toBe('input');
    });

    it('should render select for a parameter with enum values', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} />);

      // Assert
      const envSelect = screen.getByTestId('param-select-env');
      expect(envSelect).toBeInTheDocument();
      expect(envSelect.tagName.toLowerCase()).toBe('select');
    });

    it('should pre-fill text input with the parameter default value', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} />);

      // Assert
      const inputPathInput = screen.getByTestId('param-input-input-path') as HTMLInputElement;
      expect(inputPathInput.value).toBe('/data/input');
    });

    it('should pre-fill select with the parameter default value', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} />);

      // Assert
      const envSelect = screen.getByTestId('param-select-env') as HTMLSelectElement;
      expect(envSelect.value).toBe('dev');
    });

    it('should render all enum options in the select element', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} />);

      // Assert
      const envSelect = screen.getByTestId('param-select-env') as HTMLSelectElement;
      const options = Array.from(envSelect.options).map((o) => o.value);
      expect(options).toContain('dev');
      expect(options).toContain('staging');
      expect(options).toContain('prod');
    });

    it('should render text inputs for all non-enum parameters', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} />);

      // Assert: input-path, output-path, batch-size are text inputs
      expect(screen.getByTestId('param-input-input-path')).toBeInTheDocument();
      expect(screen.getByTestId('param-input-output-path')).toBeInTheDocument();
      expect(screen.getByTestId('param-input-batch-size')).toBeInTheDocument();
    });

    it('should render no parameter inputs when template has no parameters', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} template={mockTemplateNoParams} />);

      // Assert
      const anyInput = screen.queryAllByTestId(/^param-input-/);
      const anySelect = screen.queryAllByTestId(/^param-select-/);
      expect(anyInput).toHaveLength(0);
      expect(anySelect).toHaveLength(0);
    });

    it('should render select for a parameter that has only enum values', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} template={mockTemplateEnumOnly} />);

      // Assert
      const envSelect = screen.getByTestId('param-select-environment');
      expect(envSelect).toBeInTheDocument();
    });

    it('should set empty string as default when parameter has no value', () => {
      // Arrange
      const templateNoDefault = {
        name: 'no-default-template',
        namespace: 'default',
        parameters: [{ name: 'my-param' }],
      };

      // Act
      render(<SubmitModal {...defaultProps} template={templateNoDefault} />);

      // Assert
      const input = screen.getByTestId('param-input-my-param') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // User Interaction — Input Changes
  // ---------------------------------------------------------------------------
  describe('User Input Changes', () => {
    it('should update text input value when user types', () => {
      // Arrange
      render(<SubmitModal {...defaultProps} />);
      const input = screen.getByTestId('param-input-input-path') as HTMLInputElement;

      // Act
      fireEvent.change(input, { target: { value: '/new/path' } });

      // Assert
      expect(input.value).toBe('/new/path');
    });

    it('should update select value when user changes selection', () => {
      // Arrange
      render(<SubmitModal {...defaultProps} />);
      const select = screen.getByTestId('param-select-env') as HTMLSelectElement;

      // Act
      fireEvent.change(select, { target: { value: 'prod' } });

      // Assert
      expect(select.value).toBe('prod');
    });
  });

  // ---------------------------------------------------------------------------
  // Submission Flow
  // ---------------------------------------------------------------------------
  describe('Submission Flow', () => {
    it('should call submitWorkflow with correct arguments when confirm is clicked', async () => {
      // Arrange
      mockSubmitWorkflow.mockResolvedValueOnce({
        name: 'data-processing-with-params-abc12',
        namespace: 'dashboard-test',
      });
      render(<SubmitModal {...defaultProps} />);

      // Act
      fireEvent.click(screen.getByTestId('confirm-button'));

      // Assert
      await waitFor(() => {
        expect(mockSubmitWorkflow).toHaveBeenCalledWith(
          'data-processing-with-params',
          'dashboard-test',
          expect.objectContaining({
            'input-path': '/data/input',
            'output-path': '/data/output',
            'batch-size': '100',
            env: 'dev',
          })
        );
      });
    });

    it('should show spinner while submission is in progress', async () => {
      // Arrange: submitWorkflow never resolves immediately
      let resolveSubmit!: () => void;
      mockSubmitWorkflow.mockReturnValueOnce(
        new Promise<{ name: string; namespace: string }>((resolve) => {
          resolveSubmit = () => resolve({ name: 'wf-abc', namespace: 'dashboard-test' });
        })
      );
      render(<SubmitModal {...defaultProps} />);

      // Act
      fireEvent.click(screen.getByTestId('confirm-button'));

      // Assert: spinner visible while pending
      await waitFor(() => {
        expect(screen.getByTestId('submit-spinner')).toBeInTheDocument();
      });

      // Cleanup
      resolveSubmit();
    });

    it('should disable the confirm button while submitting', async () => {
      // Arrange
      let resolveSubmit!: () => void;
      mockSubmitWorkflow.mockReturnValueOnce(
        new Promise<{ name: string; namespace: string }>((resolve) => {
          resolveSubmit = () => resolve({ name: 'wf-abc', namespace: 'dashboard-test' });
        })
      );
      render(<SubmitModal {...defaultProps} />);

      // Act
      fireEvent.click(screen.getByTestId('confirm-button'));

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('confirm-button')).toBeDisabled();
      });

      // Cleanup
      resolveSubmit();
    });

    it('should disable the cancel button while submitting', async () => {
      // Arrange
      let resolveSubmit!: () => void;
      mockSubmitWorkflow.mockReturnValueOnce(
        new Promise<{ name: string; namespace: string }>((resolve) => {
          resolveSubmit = () => resolve({ name: 'wf-abc', namespace: 'dashboard-test' });
        })
      );
      render(<SubmitModal {...defaultProps} />);

      // Act
      fireEvent.click(screen.getByTestId('confirm-button'));

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('cancel-button')).toBeDisabled();
      });

      // Cleanup
      resolveSubmit();
    });
  });

  // ---------------------------------------------------------------------------
  // Success State
  // ---------------------------------------------------------------------------
  describe('Success State', () => {
    it('should show "View Workflow" button after successful submission', async () => {
      // Arrange
      mockSubmitWorkflow.mockResolvedValueOnce({
        name: 'data-processing-with-params-abc12',
        namespace: 'dashboard-test',
      });
      render(<SubmitModal {...defaultProps} />);

      // Act
      fireEvent.click(screen.getByTestId('confirm-button'));

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('view-workflow-link')).toBeInTheDocument();
      });
    });

    it('should call onNavigateToWorkflows when "View Workflow" button is clicked', async () => {
      // Arrange
      const onNavigateMock = vi.fn();
      mockSubmitWorkflow.mockResolvedValueOnce({
        name: 'data-processing-with-params-abc12',
        namespace: 'dashboard-test',
      });
      render(<SubmitModal {...defaultProps} onNavigateToWorkflows={onNavigateMock} />);

      // Act
      fireEvent.click(screen.getByTestId('confirm-button'));
      await waitFor(() => {
        expect(screen.getByTestId('view-workflow-link')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('view-workflow-link'));

      // Assert
      expect(onNavigateMock).toHaveBeenCalledTimes(1);
    });

    it('should hide the submit spinner after successful submission', async () => {
      // Arrange
      mockSubmitWorkflow.mockResolvedValueOnce({
        name: 'wf-done',
        namespace: 'dashboard-test',
      });
      render(<SubmitModal {...defaultProps} />);

      // Act
      fireEvent.click(screen.getByTestId('confirm-button'));

      // Assert
      await waitFor(() => {
        expect(screen.queryByTestId('submit-spinner')).not.toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------
  describe('Error State', () => {
    it('should show error view when submission fails', async () => {
      // Arrange
      mockSubmitWorkflow.mockRejectedValueOnce(new Error('WorkflowTemplate not found'));
      render(<SubmitModal {...defaultProps} />);

      // Act
      fireEvent.click(screen.getByTestId('confirm-button'));

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('submit-error-view')).toBeInTheDocument();
      });
    });

    it('should display the error message in the error view', async () => {
      // Arrange
      mockSubmitWorkflow.mockRejectedValueOnce(new Error('Failed to create workflow'));
      render(<SubmitModal {...defaultProps} />);

      // Act
      fireEvent.click(screen.getByTestId('confirm-button'));

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('submit-error-view')).toHaveTextContent(
          'Failed to create workflow'
        );
      });
    });

    it('should show retry button in the error state', async () => {
      // Arrange
      mockSubmitWorkflow.mockRejectedValueOnce(new Error('Server Error'));
      render(<SubmitModal {...defaultProps} />);

      // Act
      fireEvent.click(screen.getByTestId('confirm-button'));

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      });
    });

    it('should retry submission when retry button is clicked', async () => {
      // Arrange: first call fails, second succeeds
      mockSubmitWorkflow
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockResolvedValueOnce({ name: 'wf-retry-ok', namespace: 'default' });

      render(<SubmitModal {...defaultProps} />);

      // Act: first submission — fails
      fireEvent.click(screen.getByTestId('confirm-button'));
      await waitFor(() => {
        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      });

      // Act: retry
      fireEvent.click(screen.getByTestId('retry-button'));

      // Assert: second call → success state
      await waitFor(() => {
        expect(screen.getByTestId('view-workflow-link')).toBeInTheDocument();
      });

      expect(mockSubmitWorkflow).toHaveBeenCalledTimes(2);
    });

    it('should hide the submit spinner after an error', async () => {
      // Arrange
      mockSubmitWorkflow.mockRejectedValueOnce(new Error('Unexpected error'));
      render(<SubmitModal {...defaultProps} />);

      // Act
      fireEvent.click(screen.getByTestId('confirm-button'));

      // Assert
      await waitFor(() => {
        expect(screen.queryByTestId('submit-spinner')).not.toBeInTheDocument();
      });
    });

    it('should not show "View Workflow" button in the error state', async () => {
      // Arrange
      mockSubmitWorkflow.mockRejectedValueOnce(new Error('Error'));
      render(<SubmitModal {...defaultProps} />);

      // Act
      fireEvent.click(screen.getByTestId('confirm-button'));

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('submit-error-view')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('view-workflow-link')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Cancel
  // ---------------------------------------------------------------------------
  describe('Cancel Behaviour', () => {
    it('should call onClose when cancel button is clicked in idle state', () => {
      // Arrange
      const onCloseMock = vi.fn();
      render(<SubmitModal {...defaultProps} onClose={onCloseMock} />);

      // Act
      fireEvent.click(screen.getByTestId('cancel-button'));

      // Assert
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('should enable cancel button in idle state', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('cancel-button')).toBeEnabled();
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------
  describe('Accessibility', () => {
    it('should have role="dialog" on the container', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} />);

      // Assert
      const dialog = screen.getByTestId('submit-workflow-dialog');
      expect(dialog).toHaveAttribute('role', 'dialog');
    });

    it('should have aria-modal="true" on the container', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} />);

      // Assert
      const dialog = screen.getByTestId('submit-workflow-dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have an accessible label (aria-labelledby or aria-label)', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} />);

      // Assert
      const dialog = screen.getByTestId('submit-workflow-dialog');
      const labelledBy = dialog.getAttribute('aria-labelledby');
      const ariaLabel = dialog.getAttribute('aria-label');
      expect(labelledBy || ariaLabel).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle template with many parameters', () => {
      // Arrange
      const templateManyParams = {
        name: 'big-template',
        namespace: 'default',
        parameters: Array.from({ length: 8 }, (_, i) => ({
          name: `param-${i}`,
          value: `value-${i}`,
        })),
      };

      // Act
      render(<SubmitModal {...defaultProps} template={templateManyParams} />);

      // Assert
      const inputs = screen.getAllByTestId(/^param-input-/);
      expect(inputs).toHaveLength(8);
    });

    it('should handle template with mixed text and enum parameters', () => {
      // Arrange & Act
      render(<SubmitModal {...defaultProps} />);

      // Assert: 3 text inputs + 1 select
      const inputs = screen.getAllByTestId(/^param-input-/);
      const selects = screen.getAllByTestId(/^param-select-/);
      expect(inputs).toHaveLength(3);
      expect(selects).toHaveLength(1);
    });
  });
});
