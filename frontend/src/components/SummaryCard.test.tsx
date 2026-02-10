import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SummaryCard } from './SummaryCard';

describe('SummaryCard', () => {
  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Arrange & Act
      render(<SummaryCard label="Test Card" value="42" />);

      // Assert
      const card = screen.getByTestId('summary-card');
      expect(card).toBeInTheDocument();
    });

    it('should display label text', () => {
      // Arrange & Act
      render(<SummaryCard label="Nodes" value="5" />);

      // Assert
      const label = screen.getByText('Nodes');
      expect(label).toBeInTheDocument();
    });

    it('should display value text', () => {
      // Arrange & Act
      render(<SummaryCard label="Nodes" value="5" />);

      // Assert
      const value = screen.getByText('5');
      expect(value).toBeInTheDocument();
    });

    it('should be accessible as article', () => {
      // Arrange & Act
      render(<SummaryCard label="Nodes" value="5" />);

      // Assert
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
    });
  });

  describe('label rendering', () => {
    it('should display label with test id', () => {
      // Arrange & Act
      render(<SummaryCard label="Unhealthy Pods" value="3" />);

      // Assert
      const label = screen.getByTestId('summary-card-label');
      expect(label).toHaveTextContent('Unhealthy Pods');
    });

    it('should handle long label text', () => {
      // Arrange & Act
      render(<SummaryCard label="Very Long Label That Might Wrap" value="10" />);

      // Assert
      const label = screen.getByTestId('summary-card-label');
      expect(label).toHaveTextContent('Very Long Label That Might Wrap');
    });

    it('should handle short label text', () => {
      // Arrange & Act
      render(<SummaryCard label="CPU" value="45%" />);

      // Assert
      const label = screen.getByTestId('summary-card-label');
      expect(label).toHaveTextContent('CPU');
    });
  });

  describe('value rendering', () => {
    it('should display value with test id', () => {
      // Arrange & Act
      render(<SummaryCard label="Nodes" value="8" />);

      // Assert
      const value = screen.getByTestId('summary-card-value');
      expect(value).toHaveTextContent('8');
    });

    it('should handle numeric values', () => {
      // Arrange & Act
      render(<SummaryCard label="Count" value="123" />);

      // Assert
      const value = screen.getByTestId('summary-card-value');
      expect(value).toHaveTextContent('123');
    });

    it('should handle percentage values', () => {
      // Arrange & Act
      render(<SummaryCard label="Usage" value="75.5%" />);

      // Assert
      const value = screen.getByTestId('summary-card-value');
      expect(value).toHaveTextContent('75.5%');
    });

    it('should handle string values', () => {
      // Arrange & Act
      render(<SummaryCard label="Status" value="Healthy" />);

      // Assert
      const value = screen.getByTestId('summary-card-value');
      expect(value).toHaveTextContent('Healthy');
    });

    it('should handle zero value', () => {
      // Arrange & Act
      render(<SummaryCard label="Errors" value="0" />);

      // Assert
      const value = screen.getByTestId('summary-card-value');
      expect(value).toHaveTextContent('0');
    });
  });

  describe('with UsageBar child', () => {
    it('should render with UsageBar component', () => {
      // Arrange & Act
      render(
        <SummaryCard label="CPU Usage" value="65%">
          <div data-testid="usage-bar" role="progressbar" aria-valuenow={65}>
            65%
          </div>
        </SummaryCard>
      );

      // Assert
      const card = screen.getByTestId('summary-card');
      expect(card).toBeInTheDocument();

      const usageBar = screen.getByTestId('usage-bar');
      expect(usageBar).toBeInTheDocument();
    });

    it('should render without children', () => {
      // Arrange & Act
      render(<SummaryCard label="Nodes" value="5" />);

      // Assert
      const card = screen.getByTestId('summary-card');
      expect(card).toBeInTheDocument();

      const usageBar = screen.queryByTestId('usage-bar');
      expect(usageBar).not.toBeInTheDocument();
    });
  });

  describe('specific card types', () => {
    it('should render Nodes card correctly', () => {
      // Arrange & Act
      render(<SummaryCard label="Nodes" value="2 / 3" testId="summary-card-nodes" />);

      // Assert
      const card = screen.getByTestId('summary-card-nodes');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Nodes')).toBeInTheDocument();
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('should render Unhealthy Pods card correctly', () => {
      // Arrange & Act
      render(<SummaryCard label="Unhealthy Pods" value="1" testId="summary-card-unhealthy-pods" />);

      // Assert
      const card = screen.getByTestId('summary-card-unhealthy-pods');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Unhealthy Pods')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should render Avg CPU card with UsageBar', () => {
      // Arrange & Act
      render(
        <SummaryCard label="Avg CPU" value="45.5%" testId="summary-card-avg-cpu">
          <div data-testid="usage-bar" role="progressbar" aria-valuenow={45.5}>
            45.5%
          </div>
        </SummaryCard>
      );

      // Assert
      const card = screen.getByTestId('summary-card-avg-cpu');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Avg CPU')).toBeInTheDocument();
      expect(screen.getAllByText('45.5%').length).toBeGreaterThanOrEqual(1);

      const usageBar = screen.getByTestId('usage-bar');
      expect(usageBar).toBeInTheDocument();
    });

    it('should render Avg Memory card with UsageBar', () => {
      // Arrange & Act
      render(
        <SummaryCard label="Avg Memory" value="62.3%" testId="summary-card-avg-memory">
          <div data-testid="usage-bar" role="progressbar" aria-valuenow={62.3}>
            62.3%
          </div>
        </SummaryCard>
      );

      // Assert
      const card = screen.getByTestId('summary-card-avg-memory');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Avg Memory')).toBeInTheDocument();
      expect(screen.getAllByText('62.3%').length).toBeGreaterThanOrEqual(1);

      const usageBar = screen.getByTestId('usage-bar');
      expect(usageBar).toBeInTheDocument();
    });
  });

  describe('styling and layout', () => {
    it('should have proper CSS classes', () => {
      // Arrange & Act
      render(<SummaryCard label="Test" value="123" />);

      // Assert
      const card = screen.getByTestId('summary-card');
      expect(card.className).toBeTruthy();
    });

    it('should be styled as a card component', () => {
      // Arrange & Act
      render(<SummaryCard label="Test" value="123" />);

      // Assert
      const card = screen.getByTestId('summary-card');
      // Card should have rounded corners, padding, background, etc.
      expect(card.className).toMatch(/rounded|shadow|bg-|p-/);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string value', () => {
      // Arrange & Act
      render(<SummaryCard label="Test" value="" />);

      // Assert
      const value = screen.getByTestId('summary-card-value');
      expect(value).toBeInTheDocument();
    });

    it('should handle very long values', () => {
      // Arrange & Act
      render(<SummaryCard label="Test" value="123456789012345" />);

      // Assert
      const value = screen.getByTestId('summary-card-value');
      expect(value).toHaveTextContent('123456789012345');
    });

    it('should handle special characters in label', () => {
      // Arrange & Act
      render(<SummaryCard label="Test & Label (Special)" value="100" />);

      // Assert
      const label = screen.getByTestId('summary-card-label');
      expect(label).toHaveTextContent('Test & Label (Special)');
    });

    it('should handle special characters in value', () => {
      // Arrange & Act
      render(<SummaryCard label="Status" value="OK ✓" />);

      // Assert
      const value = screen.getByTestId('summary-card-value');
      expect(value).toHaveTextContent('OK ✓');
    });
  });

  describe('accessibility', () => {
    it('should have semantic HTML with article role', () => {
      // Arrange & Act
      render(<SummaryCard label="Nodes" value="5" />);

      // Assert
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
    });

    it('should have accessible label text', () => {
      // Arrange & Act
      render(<SummaryCard label="Unhealthy Pods" value="3" />);

      // Assert
      const card = screen.getByRole('article', { name: /unhealthy pods/i });
      expect(card).toBeInTheDocument();
    });

    it('should support custom test id', () => {
      // Arrange & Act
      render(<SummaryCard label="Test" value="123" testId="custom-card-id" />);

      // Assert
      const card = screen.getByTestId('custom-card-id');
      expect(card).toBeInTheDocument();
    });
  });
});
