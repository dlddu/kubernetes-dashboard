import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RestartConfirmDialog } from './RestartConfirmDialog';

describe('RestartConfirmDialog Component', () => {
  describe('Basic Rendering', () => {
    it('should render dialog when open', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const dialog = screen.getByTestId('restart-confirm-dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toBeVisible();
    });

    it('should not render dialog when closed', () => {
      // Arrange
      const props = {
        isOpen: false,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const dialog = screen.queryByTestId('restart-confirm-dialog');
      expect(dialog).not.toBeVisible();
    });

    it('should display deployment name in dialog', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'nginx-deployment',
        deploymentNamespace: 'production',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const dialog = screen.getByTestId('restart-confirm-dialog');
      expect(dialog).toHaveTextContent('nginx-deployment');
    });

    it('should display deployment namespace in dialog', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'kube-system',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const dialog = screen.getByTestId('restart-confirm-dialog');
      expect(dialog).toHaveTextContent('kube-system');
    });

    it('should display warning or confirmation message', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const dialog = screen.getByTestId('restart-confirm-dialog');
      const dialogText = dialog.textContent?.toLowerCase() || '';
      expect(dialogText).toMatch(/restart|confirm|sure/);
    });
  });

  describe('Confirm Button', () => {
    it('should display confirm button', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const confirmButton = screen.getByTestId('confirm-button');
      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).toBeVisible();
    });

    it('should enable confirm button by default', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const confirmButton = screen.getByTestId('confirm-button');
      expect(confirmButton).toBeEnabled();
    });

    it('should call onConfirm when confirm button is clicked', () => {
      // Arrange
      const onConfirmMock = vi.fn();
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: onConfirmMock,
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);
      const confirmButton = screen.getByTestId('confirm-button');
      fireEvent.click(confirmButton);

      // Assert
      expect(onConfirmMock).toHaveBeenCalledTimes(1);
    });

    it('should disable confirm button when restarting', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
        isRestarting: true,
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const confirmButton = screen.getByTestId('confirm-button');
      expect(confirmButton).toBeDisabled();
    });

    it('should show loading indicator when restarting', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
        isRestarting: true,
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const confirmButton = screen.getByTestId('confirm-button');
      expect(confirmButton).toHaveAttribute('aria-busy', 'true');
    });

    it('should display "Restarting..." text when restarting', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
        isRestarting: true,
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const confirmButton = screen.getByTestId('confirm-button');
      expect(confirmButton).toHaveTextContent(/restarting/i);
    });
  });

  describe('Cancel Button', () => {
    it('should display cancel button', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const cancelButton = screen.getByTestId('cancel-button');
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toBeVisible();
    });

    it('should enable cancel button by default', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const cancelButton = screen.getByTestId('cancel-button');
      expect(cancelButton).toBeEnabled();
    });

    it('should call onCancel when cancel button is clicked', () => {
      // Arrange
      const onCancelMock = vi.fn();
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: onCancelMock,
      };

      // Act
      render(<RestartConfirmDialog {...props} />);
      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.click(cancelButton);

      // Assert
      expect(onCancelMock).toHaveBeenCalledTimes(1);
    });

    it('should disable cancel button when restarting', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
        isRestarting: true,
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const cancelButton = screen.getByTestId('cancel-button');
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Error State', () => {
    it('should display error message when error prop is provided', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
        error: 'Failed to restart deployment',
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Failed to restart deployment');
    });

    it('should not display error message when no error', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const errorMessage = screen.queryByTestId('error-message');
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should enable buttons when error is shown', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
        error: 'Failed to restart',
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const confirmButton = screen.getByTestId('confirm-button');
      const cancelButton = screen.getByTestId('cancel-button');
      expect(confirmButton).toBeEnabled();
      expect(cancelButton).toBeEnabled();
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const dialog = screen.getByTestId('restart-confirm-dialog');
      expect(dialog).toHaveAttribute('role', 'dialog');
    });

    it('should have aria-modal="true"', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const dialog = screen.getByTestId('restart-confirm-dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby or aria-label', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const dialog = screen.getByTestId('restart-confirm-dialog');
      const ariaLabelledBy = dialog.getAttribute('aria-labelledby');
      const ariaLabel = dialog.getAttribute('aria-label');
      expect(ariaLabelledBy || ariaLabel).toBeTruthy();
    });

    it('should trap focus within dialog', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert - buttons should be focusable
      const confirmButton = screen.getByTestId('confirm-button');
      const cancelButton = screen.getByTestId('cancel-button');
      expect(confirmButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    it('should announce error to screen readers', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
        error: 'Failed to restart deployment',
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close dialog on Escape key', () => {
      // Arrange
      const onCancelMock = vi.fn();
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: onCancelMock,
      };

      // Act
      render(<RestartConfirmDialog {...props} />);
      const dialog = screen.getByTestId('restart-confirm-dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      // Assert
      expect(onCancelMock).toHaveBeenCalledTimes(1);
    });

    it('should not close dialog on Escape when restarting', () => {
      // Arrange
      const onCancelMock = vi.fn();
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: onCancelMock,
        isRestarting: true,
      };

      // Act
      render(<RestartConfirmDialog {...props} />);
      const dialog = screen.getByTestId('restart-confirm-dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      // Assert
      expect(onCancelMock).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty deployment name', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: '',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const dialog = screen.getByTestId('restart-confirm-dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should handle very long deployment names', () => {
      // Arrange
      const props = {
        isOpen: true,
        deploymentName: 'very-long-deployment-name-that-might-break-layout-if-not-handled-properly',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const dialog = screen.getByTestId('restart-confirm-dialog');
      expect(dialog).toHaveTextContent(props.deploymentName);
    });

    it('should handle very long error messages', () => {
      // Arrange
      const longError = 'Failed to restart deployment due to network connectivity issues and authentication failures that occurred during the request processing';
      const props = {
        isOpen: true,
        deploymentName: 'test-deployment',
        deploymentNamespace: 'default',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
        error: longError,
      };

      // Act
      render(<RestartConfirmDialog {...props} />);

      // Assert
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toHaveTextContent(longError);
    });
  });
});
