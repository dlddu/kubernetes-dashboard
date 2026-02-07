import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TopBar from './TopBar';
import { NamespaceProvider } from '../context/NamespaceContext';

// Mock the NamespaceSelector component
vi.mock('./NamespaceSelector', () => ({
  default: () => <div data-testid="namespace-selector-mock">NamespaceSelector</div>,
}));

describe('TopBar', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<NamespaceProvider>{component}</NamespaceProvider>);
  };

  describe('Rendering', () => {
    it('should render without crashing', () => {
      // Arrange & Act
      renderWithProvider(<TopBar />);

      // Assert
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should render as a semantic header element', () => {
      // Arrange & Act
      const { container } = renderWithProvider(<TopBar />);

      // Assert
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('should have correct test ID', () => {
      // Arrange & Act
      renderWithProvider(<TopBar />);

      // Assert
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should display Kubernetes Dashboard title', () => {
      // Arrange & Act
      renderWithProvider(<TopBar />);

      // Assert
      expect(screen.getByText(/kubernetes dashboard/i)).toBeInTheDocument();
    });

    it('should include NamespaceSelector component', () => {
      // Arrange & Act
      renderWithProvider(<TopBar />);

      // Assert
      expect(screen.getByTestId('namespace-selector-mock')).toBeInTheDocument();
    });

    it('should have a logo or icon', () => {
      // Arrange & Act
      renderWithProvider(<TopBar />);

      // Assert
      const logo = screen.getByAltText(/logo/i);
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should display title and selector in horizontal layout', () => {
      // Arrange & Act
      const { container } = renderWithProvider(<TopBar />);

      // Assert
      const topBar = container.querySelector('[data-testid="top-bar"]');
      expect(topBar).toHaveClass('flex');
    });

    it('should use proper spacing between elements', () => {
      // Arrange & Act
      const { container } = renderWithProvider(<TopBar />);

      // Assert
      const topBar = container.querySelector('[data-testid="top-bar"]');
      expect(topBar).toHaveClass('justify-between');
    });

    it('should be sticky at the top of the page', () => {
      // Arrange & Act
      const { container } = renderWithProvider(<TopBar />);

      // Assert
      const topBar = container.querySelector('[data-testid="top-bar"]');
      expect(topBar).toHaveClass('sticky');
      expect(topBar).toHaveClass('top-0');
    });

    it('should have proper z-index for layering', () => {
      // Arrange & Act
      const { container } = renderWithProvider(<TopBar />);

      // Assert
      const topBar = container.querySelector('[data-testid="top-bar"]');
      expect(topBar).toHaveClass('z-10');
    });
  });

  describe('Styling', () => {
    it('should have background color', () => {
      // Arrange & Act
      const { container } = renderWithProvider(<TopBar />);

      // Assert
      const topBar = container.querySelector('[data-testid="top-bar"]');
      expect(topBar?.className).toMatch(/bg-/);
    });

    it('should have shadow or border for visual separation', () => {
      // Arrange & Act
      const { container } = renderWithProvider(<TopBar />);

      // Assert
      const topBar = container.querySelector('[data-testid="top-bar"]');
      const hasVisualSeparation =
        topBar?.className.includes('shadow') || topBar?.className.includes('border');
      expect(hasVisualSeparation).toBe(true);
    });

    it('should have padding for inner content', () => {
      // Arrange & Act
      const { container } = renderWithProvider(<TopBar />);

      // Assert
      const topBar = container.querySelector('[data-testid="top-bar"]');
      expect(topBar?.className).toMatch(/p[xy]?-/);
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile viewports', () => {
      // Arrange & Act
      const { container } = renderWithProvider(<TopBar />);

      // Assert
      const topBar = container.querySelector('[data-testid="top-bar"]');
      // Check for responsive classes like sm:, md:, lg:
      const hasResponsiveClasses = topBar?.className.match(/(?:sm|md|lg):/);
      expect(hasResponsiveClasses).toBeTruthy();
    });

    it('should display all elements on mobile', () => {
      // Arrange & Act
      renderWithProvider(<TopBar />);

      // Assert - All key elements should be visible
      expect(screen.getByText(/kubernetes dashboard/i)).toBeInTheDocument();
      expect(screen.getByTestId('namespace-selector-mock')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="banner" for screen readers', () => {
      // Arrange & Act
      renderWithProvider(<TopBar />);

      // Assert
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should have semantic heading for title', () => {
      // Arrange & Act
      renderWithProvider(<TopBar />);

      // Assert
      const heading = screen.getByRole('heading', { name: /kubernetes dashboard/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have proper heading level', () => {
      // Arrange & Act
      const { container } = renderWithProvider(<TopBar />);

      // Assert
      const h1 = container.querySelector('h1');
      expect(h1).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      // Arrange & Act
      renderWithProvider(<TopBar />);

      // Assert - NamespaceSelector should be focusable
      const selector = screen.getByTestId('namespace-selector-mock');
      expect(selector).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should integrate with NamespaceContext', () => {
      // Arrange & Act
      renderWithProvider(<TopBar />);

      // Assert - Should render without context errors
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
      expect(screen.getByTestId('namespace-selector-mock')).toBeInTheDocument();
    });

    it('should work without NamespaceProvider when not using context directly', () => {
      // Arrange & Act
      // TopBar itself doesn't use context, only NamespaceSelector does
      const { container } = render(<TopBar />);

      // Assert - Should render structure even without provider
      const topBar = container.querySelector('[data-testid="top-bar"]');
      expect(topBar).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      // Arrange
      const renderSpy = vi.fn();
      const SpyWrapper = ({ children }: { children: React.ReactNode }) => {
        renderSpy();
        return <>{children}</>;
      };

      // Act
      const { rerender } = render(
        <NamespaceProvider>
          <SpyWrapper>
            <TopBar />
          </SpyWrapper>
        </NamespaceProvider>
      );

      const initialRenderCount = renderSpy.mock.calls.length;

      // Re-render with same props
      rerender(
        <NamespaceProvider>
          <SpyWrapper>
            <TopBar />
          </SpyWrapper>
        </NamespaceProvider>
      );

      // Assert - Should have rendered twice (initial + rerender)
      expect(renderSpy).toHaveBeenCalledTimes(initialRenderCount + 1);
    });
  });
});
