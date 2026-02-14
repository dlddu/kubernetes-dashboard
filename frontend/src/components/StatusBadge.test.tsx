import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Arrange & Act
      render(<StatusBadge status="Running" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toBeInTheDocument();
    });

    it('should display status text', () => {
      // Arrange & Act
      render(<StatusBadge status="CrashLoopBackOff" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('CrashLoopBackOff');
    });

    it('should be accessible with role status', () => {
      // Arrange & Act
      render(<StatusBadge status="Running" />);

      // Assert
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('error status styling - red variant', () => {
    it('should display CrashLoopBackOff with error styling', () => {
      // Arrange & Act
      render(<StatusBadge status="CrashLoopBackOff" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('CrashLoopBackOff');
      expect(badge.className).toMatch(/red|error|danger/i);
    });

    it('should display ImagePullBackOff with error styling', () => {
      // Arrange & Act
      render(<StatusBadge status="ImagePullBackOff" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('ImagePullBackOff');
      expect(badge.className).toMatch(/red|error|danger/i);
    });

    it('should display ErrImagePull with error styling', () => {
      // Arrange & Act
      render(<StatusBadge status="ErrImagePull" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('ErrImagePull');
      expect(badge.className).toMatch(/red|error|danger/i);
    });

    it('should display Failed with error styling', () => {
      // Arrange & Act
      render(<StatusBadge status="Failed" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('Failed');
      expect(badge.className).toMatch(/red|error|danger/i);
    });

    it('should display Error with error styling', () => {
      // Arrange & Act
      render(<StatusBadge status="Error" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('Error');
      expect(badge.className).toMatch(/red|error|danger/i);
    });
  });

  describe('warning status styling - yellow variant', () => {
    it('should display Pending with warning styling', () => {
      // Arrange & Act
      render(<StatusBadge status="Pending" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('Pending');
      expect(badge.className).toMatch(/yellow|warning|amber/i);
    });

    it('should display Unknown with warning styling', () => {
      // Arrange & Act
      render(<StatusBadge status="Unknown" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('Unknown');
      expect(badge.className).toMatch(/yellow|warning|amber/i);
    });

    it('should display ContainerCreating with warning styling', () => {
      // Arrange & Act
      render(<StatusBadge status="ContainerCreating" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('ContainerCreating');
      expect(badge.className).toMatch(/yellow|warning|amber/i);
    });
  });

  describe('success status styling - green variant', () => {
    it('should display Running with success styling', () => {
      // Arrange & Act
      render(<StatusBadge status="Running" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('Running');
      expect(badge.className).toMatch(/green|success/i);
    });

    it('should display Succeeded with success styling', () => {
      // Arrange & Act
      render(<StatusBadge status="Succeeded" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('Succeeded');
      expect(badge.className).toMatch(/green|success/i);
    });

    it('should display Completed with success styling', () => {
      // Arrange & Act
      render(<StatusBadge status="Completed" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('Completed');
      expect(badge.className).toMatch(/green|success/i);
    });
  });

  describe('visual styling', () => {
    it('should have badge-like CSS classes', () => {
      // Arrange & Act
      render(<StatusBadge status="Running" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      // Badge should have rounded corners, padding, etc.
      expect(badge.className).toMatch(/rounded|px-|py-|inline|text-/);
    });

    it('should be styled as inline element', () => {
      // Arrange & Act
      render(<StatusBadge status="Running" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge.className).toMatch(/inline/);
    });

    it('should have appropriate text sizing', () => {
      // Arrange & Act
      render(<StatusBadge status="Running" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge.className).toMatch(/text-/);
    });
  });

  describe('edge cases', () => {
    it('should handle empty status string', () => {
      // Arrange & Act
      render(<StatusBadge status="" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toBeInTheDocument();
    });

    it('should handle very long status names', () => {
      // Arrange & Act
      render(<StatusBadge status="VeryLongStatusNameThatMightWrap" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('VeryLongStatusNameThatMightWrap');
    });

    it('should handle status with special characters', () => {
      // Arrange & Act
      render(<StatusBadge status="Status-With-Dashes" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('Status-With-Dashes');
    });

    it('should handle lowercase status names', () => {
      // Arrange & Act
      render(<StatusBadge status="running" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('running');
    });

    it('should handle unknown/custom status names', () => {
      // Arrange & Act
      render(<StatusBadge status="CustomStatus" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('CustomStatus');
    });
  });

  describe('status mapping logic', () => {
    it('should correctly identify error statuses', () => {
      // Arrange & Act
      const errorStatuses = ['CrashLoopBackOff', 'ImagePullBackOff', 'ErrImagePull', 'InvalidImageName', 'RunContainerError', 'OOMKilled', 'Failed', 'Error'];

      errorStatuses.forEach((status) => {
        const { container } = render(<StatusBadge status={status} />);
        const badge = screen.getByTestId('status-badge');

        // Assert
        expect(badge.className).toMatch(/red|error|danger/i);

        // Cleanup for next iteration
        container.remove();
      });
    });

    it('should correctly identify warning statuses', () => {
      // Arrange & Act
      const warningStatuses = ['Pending', 'Unknown', 'ContainerCreating'];

      warningStatuses.forEach((status) => {
        const { container } = render(<StatusBadge status={status} />);
        const badge = screen.getByTestId('status-badge');

        // Assert
        expect(badge.className).toMatch(/yellow|warning|amber/i);

        // Cleanup for next iteration
        container.remove();
      });
    });

    it('should correctly identify success statuses', () => {
      // Arrange & Act
      const successStatuses = ['Running', 'Succeeded', 'Completed'];

      successStatuses.forEach((status) => {
        const { container } = render(<StatusBadge status={status} />);
        const badge = screen.getByTestId('status-badge');

        // Assert
        expect(badge.className).toMatch(/green|success/i);

        // Cleanup for next iteration
        container.remove();
      });
    });
  });

  describe('accessibility', () => {
    it('should have accessible role', () => {
      // Arrange & Act
      render(<StatusBadge status="Running" />);

      // Assert
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
    });

    it('should be readable by screen readers', () => {
      // Arrange & Act
      render(<StatusBadge status="CrashLoopBackOff" />);

      // Assert
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('CrashLoopBackOff');
    });

    it('should have proper ARIA attributes for status role', () => {
      // Arrange & Act
      render(<StatusBadge status="Running" />);

      // Assert
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('should support custom test id', () => {
      // Arrange & Act
      render(<StatusBadge status="Running" testId="custom-badge-id" />);

      // Assert
      const badge = screen.getByTestId('custom-badge-id');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('component props', () => {
    it('should accept status as required prop', () => {
      // Arrange & Act
      render(<StatusBadge status="Running" />);

      // Assert
      const badge = screen.getByTestId('status-badge');
      expect(badge).toBeInTheDocument();
    });

    it('should accept optional testId prop', () => {
      // Arrange & Act
      render(<StatusBadge status="Running" testId="my-custom-badge" />);

      // Assert
      const badge = screen.getByTestId('my-custom-badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render consistently with same props', () => {
      // Arrange & Act
      const { rerender } = render(<StatusBadge status="Running" />);
      const firstRender = screen.getByTestId('status-badge').textContent;

      rerender(<StatusBadge status="Running" />);
      const secondRender = screen.getByTestId('status-badge').textContent;

      // Assert
      expect(firstRender).toBe(secondRender);
    });
  });
});
