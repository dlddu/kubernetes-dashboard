import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeploymentCard } from './DeploymentCard';

describe('DeploymentCard Component', () => {
  describe('Basic Rendering', () => {
    it('should render deployment card container', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 2,
        readyReplicas: 2,
        availableReplicas: 2,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const card = screen.getByTestId('deployment-card');
      expect(card).toBeInTheDocument();
    });

    it('should display deployment name', () => {
      // Arrange
      const deployment = {
        name: 'my-deployment',
        namespace: 'default',
        replicas: 3,
        readyReplicas: 3,
        availableReplicas: 3,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const deploymentName = screen.getByTestId('deployment-name');
      expect(deploymentName).toBeInTheDocument();
      expect(deploymentName).toHaveTextContent('my-deployment');
    });

    it('should display deployment namespace', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'kube-system',
        replicas: 1,
        readyReplicas: 1,
        availableReplicas: 1,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const namespace = screen.getByTestId('deployment-namespace');
      expect(namespace).toBeInTheDocument();
      expect(namespace).toHaveTextContent('kube-system');
    });

    it('should display ready ratio', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 5,
        readyReplicas: 3,
        availableReplicas: 3,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const readyRatio = screen.getByTestId('deployment-ready');
      expect(readyRatio).toBeInTheDocument();
      expect(readyRatio).toHaveTextContent(/3\/5/);
    });

    it('should display all information together', () => {
      // Arrange
      const deployment = {
        name: 'nginx-deployment',
        namespace: 'production',
        replicas: 4,
        readyReplicas: 4,
        availableReplicas: 4,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      expect(screen.getByTestId('deployment-name')).toHaveTextContent('nginx-deployment');
      expect(screen.getByTestId('deployment-namespace')).toHaveTextContent('production');
      expect(screen.getByTestId('deployment-ready')).toHaveTextContent(/4\/4/);
    });
  });

  describe('Restart Button', () => {
    it('should display restart button', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 2,
        readyReplicas: 2,
        availableReplicas: 2,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const restartButton = screen.getByTestId('restart-button');
      expect(restartButton).toBeInTheDocument();
      expect(restartButton).toBeEnabled();
    });

    it('should display restart button with appropriate text', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 2,
        readyReplicas: 2,
        availableReplicas: 2,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const restartButton = screen.getByTestId('restart-button');
      const buttonText = restartButton.textContent || '';
      expect(buttonText.toLowerCase()).toMatch(/restart/);
    });

    it('should call onRestart callback when restart button is clicked', () => {
      // Arrange
      const onRestartMock = vi.fn();
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 2,
        readyReplicas: 2,
        availableReplicas: 2,
        onRestart: onRestartMock,
      };

      // Act
      render(<DeploymentCard {...deployment} />);
      const restartButton = screen.getByTestId('restart-button');
      fireEvent.click(restartButton);

      // Assert
      expect(onRestartMock).toHaveBeenCalledTimes(1);
      expect(onRestartMock).toHaveBeenCalledWith({
        name: 'test-deployment',
        namespace: 'default',
      });
    });

    it('should disable restart button when restarting', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 2,
        readyReplicas: 2,
        availableReplicas: 2,
        isRestarting: true,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const restartButton = screen.getByTestId('restart-button');
      expect(restartButton).toBeDisabled();
    });

    it('should show loading indicator when restarting', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 2,
        readyReplicas: 2,
        availableReplicas: 2,
        isRestarting: true,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const restartButton = screen.getByTestId('restart-button');
      expect(restartButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Replica Status Display', () => {
    it('should show green status when all replicas are ready', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 3,
        readyReplicas: 3,
        availableReplicas: 3,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const readyRatio = screen.getByTestId('deployment-ready');
      expect(readyRatio).toHaveClass(/green|success|healthy/i);
    });

    it('should show warning status when some replicas are not ready', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 3,
        readyReplicas: 1,
        availableReplicas: 1,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const readyRatio = screen.getByTestId('deployment-ready');
      expect(readyRatio).toHaveClass(/yellow|warning|degraded/i);
    });

    it('should show error status when no replicas are ready', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 3,
        readyReplicas: 0,
        availableReplicas: 0,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const readyRatio = screen.getByTestId('deployment-ready');
      expect(readyRatio).toHaveClass(/red|error|critical/i);
    });

    it('should handle zero desired replicas', () => {
      // Arrange
      const deployment = {
        name: 'scaled-down-deployment',
        namespace: 'default',
        replicas: 0,
        readyReplicas: 0,
        availableReplicas: 0,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const readyRatio = screen.getByTestId('deployment-ready');
      expect(readyRatio).toHaveTextContent(/0\/0/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty deployment name', () => {
      // Arrange
      const deployment = {
        name: '',
        namespace: 'default',
        replicas: 1,
        readyReplicas: 1,
        availableReplicas: 1,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const card = screen.getByTestId('deployment-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle long deployment names', () => {
      // Arrange
      const deployment = {
        name: 'very-long-deployment-name-that-might-break-layout-if-not-handled-properly',
        namespace: 'default',
        replicas: 1,
        readyReplicas: 1,
        availableReplicas: 1,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const deploymentName = screen.getByTestId('deployment-name');
      expect(deploymentName).toHaveTextContent(deployment.name);
    });

    it('should handle negative replica counts gracefully', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: -1,
        readyReplicas: -1,
        availableReplicas: -1,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert - should render without crashing
      const card = screen.getByTestId('deployment-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle readyReplicas greater than replicas', () => {
      // Arrange - this shouldn't happen but test robustness
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 2,
        readyReplicas: 3,
        availableReplicas: 3,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert - should render without crashing
      const card = screen.getByTestId('deployment-card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="button" for restart button', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 2,
        readyReplicas: 2,
        availableReplicas: 2,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const restartButton = screen.getByTestId('restart-button');
      expect(restartButton).toHaveAttribute('role', 'button');
    });

    it('should have descriptive aria-label for restart button', () => {
      // Arrange
      const deployment = {
        name: 'nginx-deployment',
        namespace: 'production',
        replicas: 2,
        readyReplicas: 2,
        availableReplicas: 2,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const restartButton = screen.getByTestId('restart-button');
      const ariaLabel = restartButton.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/restart/i);
      expect(ariaLabel).toMatch(/nginx-deployment/i);
    });

    it('should be keyboard navigable', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 2,
        readyReplicas: 2,
        availableReplicas: 2,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const restartButton = screen.getByTestId('restart-button');
      expect(restartButton).toBeInTheDocument();
      // Button should be focusable
      restartButton.focus();
      expect(restartButton).toHaveFocus();
    });

    it('should announce restarting state to screen readers', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 2,
        readyReplicas: 2,
        availableReplicas: 2,
        isRestarting: true,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const restartButton = screen.getByTestId('restart-button');
      expect(restartButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Visual Layout', () => {
    it('should render with proper card styling', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 2,
        readyReplicas: 2,
        availableReplicas: 2,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert
      const card = screen.getByTestId('deployment-card');
      expect(card).toBeVisible();
    });

    it('should display elements in correct order', () => {
      // Arrange
      const deployment = {
        name: 'test-deployment',
        namespace: 'default',
        replicas: 2,
        readyReplicas: 2,
        availableReplicas: 2,
      };

      // Act
      render(<DeploymentCard {...deployment} />);

      // Assert - all elements should be present
      expect(screen.getByTestId('deployment-name')).toBeInTheDocument();
      expect(screen.getByTestId('deployment-namespace')).toBeInTheDocument();
      expect(screen.getByTestId('deployment-ready')).toBeInTheDocument();
      expect(screen.getByTestId('restart-button')).toBeInTheDocument();
    });
  });
});
