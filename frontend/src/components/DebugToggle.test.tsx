import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { DebugToggle } from './DebugToggle';
import { DebugProvider } from '../contexts/DebugContext';

// Helper to render with DebugProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<DebugProvider>{ui}</DebugProvider>);
};

describe('DebugToggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('rendering - basic structure', () => {
    it('should render without crashing', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle).toBeInTheDocument();
    });

    it('should render as a button element', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle.tagName).toBe('BUTTON');
    });

    it('should display bug icon', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      const icon = toggle.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should display "Debug OFF" text when initially disabled', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle).toHaveTextContent(/Debug OFF/i);
    });
  });

  describe('toggle functionality - happy path', () => {
    it('should toggle from OFF to ON when clicked', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle).toHaveTextContent(/Debug OFF/i);

      // Act
      await user.click(toggle);

      // Assert
      expect(toggle).toHaveTextContent(/Debug ON/i);
    });

    it('should toggle from ON to OFF when clicked twice', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Act - First click: OFF -> ON
      await user.click(toggle);
      expect(toggle).toHaveTextContent(/Debug ON/i);

      // Act - Second click: ON -> OFF
      await user.click(toggle);

      // Assert
      expect(toggle).toHaveTextContent(/Debug OFF/i);
    });

    it('should toggle multiple times correctly', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Act & Assert - Multiple toggles
      expect(toggle).toHaveTextContent(/Debug OFF/i);

      await user.click(toggle);
      expect(toggle).toHaveTextContent(/Debug ON/i);

      await user.click(toggle);
      expect(toggle).toHaveTextContent(/Debug OFF/i);

      await user.click(toggle);
      expect(toggle).toHaveTextContent(/Debug ON/i);
    });
  });

  describe('styling - OFF state', () => {
    it('should have gray background when OFF', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle.className).toMatch(/bg-gray-100/);
    });

    it('should have gray text when OFF', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle.className).toMatch(/text-gray-500/);
    });

    it('should have gray border when OFF', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle.className).toMatch(/border-gray-200/);
    });

    it('should have all OFF state classes together', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle.className).toMatch(/bg-gray-100/);
      expect(toggle.className).toMatch(/text-gray-500/);
      expect(toggle.className).toMatch(/border-gray-200/);
    });
  });

  describe('styling - ON state', () => {
    it('should have cyan background when ON', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Act - Turn ON
      await user.click(toggle);

      // Assert
      expect(toggle.className).toMatch(/bg-cyan-500/);
    });

    it('should have white text when ON', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Act - Turn ON
      await user.click(toggle);

      // Assert
      expect(toggle.className).toMatch(/text-white/);
    });

    it('should have cyan border when ON', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Act - Turn ON
      await user.click(toggle);

      // Assert
      expect(toggle.className).toMatch(/border-cyan-600/);
    });

    it('should have all ON state classes together', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Act - Turn ON
      await user.click(toggle);

      // Assert
      expect(toggle.className).toMatch(/bg-cyan-500/);
      expect(toggle.className).toMatch(/text-white/);
      expect(toggle.className).toMatch(/border-cyan-600/);
    });

    it('should not have OFF state classes when ON', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Act - Turn ON
      await user.click(toggle);

      // Assert - Should NOT have gray classes
      expect(toggle.className).not.toMatch(/bg-gray-100/);
      expect(toggle.className).not.toMatch(/text-gray-500/);
      expect(toggle.className).not.toMatch(/border-gray-200/);
    });
  });

  describe('styling - transitions', () => {
    it('should switch classes from OFF to ON', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Check initial OFF state
      expect(toggle.className).toMatch(/bg-gray-100/);

      // Act
      await user.click(toggle);

      // Assert - Classes changed to ON state
      expect(toggle.className).toMatch(/bg-cyan-500/);
      expect(toggle.className).not.toMatch(/bg-gray-100/);
    });

    it('should switch classes from ON back to OFF', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Turn ON first
      await user.click(toggle);
      expect(toggle.className).toMatch(/bg-cyan-500/);

      // Act - Turn OFF
      await user.click(toggle);

      // Assert - Classes changed back to OFF state
      expect(toggle.className).toMatch(/bg-gray-100/);
      expect(toggle.className).not.toMatch(/bg-cyan-500/);
    });
  });

  describe('accessibility', () => {
    it('should have proper aria-pressed attribute when OFF', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have proper aria-pressed attribute when ON', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Act
      await user.click(toggle);

      // Assert
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have descriptive aria-label when OFF', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle).toHaveAttribute('aria-label');
      const ariaLabel = toggle.getAttribute('aria-label');
      expect(ariaLabel?.toLowerCase()).toMatch(/debug.*disabled|debug.*off/i);
    });

    it('should have descriptive aria-label when ON', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Act
      await user.click(toggle);

      // Assert
      expect(toggle).toHaveAttribute('aria-label');
      const ariaLabel = toggle.getAttribute('aria-label');
      expect(ariaLabel?.toLowerCase()).toMatch(/debug.*enabled|debug.*on/i);
    });

    it('should be keyboard accessible with Enter key', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Act - Focus and press Enter
      toggle.focus();
      await user.keyboard('{Enter}');

      // Assert
      expect(toggle).toHaveTextContent(/Debug ON/i);
    });

    it('should be keyboard accessible with Space key', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Act - Focus and press Space
      toggle.focus();
      await user.keyboard(' ');

      // Assert
      expect(toggle).toHaveTextContent(/Debug ON/i);
    });

    it('should be focusable', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');
      toggle.focus();

      // Assert
      expect(toggle).toHaveFocus();
    });

    it('should have button role', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();
    });
  });

  describe('context integration', () => {
    it('should use useDebugContext hook for state', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Act - Toggle ON
      await user.click(toggle);

      // Assert - State should persist across re-renders
      expect(toggle).toHaveTextContent(/Debug ON/i);
    });

    it('should sync state with DebugContext', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });

      // Render two toggle components in the same provider
      renderWithProvider(
        <div>
          <DebugToggle />
          <DebugToggle />
        </div>
      );

      const toggles = screen.getAllByTestId('debug-toggle');
      expect(toggles).toHaveLength(2);

      // Act - Click first toggle
      await user.click(toggles[0]);

      // Assert - Both toggles should reflect the same state
      expect(toggles[0]).toHaveTextContent(/Debug ON/i);
      expect(toggles[1]).toHaveTextContent(/Debug ON/i);
    });

    it('should handle toggle from second component instance', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });

      renderWithProvider(
        <div>
          <DebugToggle />
          <DebugToggle />
        </div>
      );

      const toggles = screen.getAllByTestId('debug-toggle');

      // Act - Click second toggle
      await user.click(toggles[1]);

      // Assert - Both toggles should reflect the same state
      expect(toggles[0]).toHaveTextContent(/Debug ON/i);
      expect(toggles[1]).toHaveTextContent(/Debug ON/i);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid clicks', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Act - Rapid clicks
      await user.click(toggle);
      await user.click(toggle);
      await user.click(toggle);
      await user.click(toggle);

      // Assert - Should end in OFF state after 4 clicks
      expect(toggle).toHaveTextContent(/Debug OFF/i);
    });

    it('should handle rapid clicks ending in ON state', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Act - Rapid clicks (odd number)
      await user.click(toggle);
      await user.click(toggle);
      await user.click(toggle);

      // Assert - Should end in ON state after 3 clicks
      expect(toggle).toHaveTextContent(/Debug ON/i);
    });

    it('should maintain state across parent re-renders', () => {
      // Arrange
      const { rerender } = renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle).toHaveTextContent(/Debug OFF/i);

      // Act - Re-render the same component
      rerender(
        <DebugProvider>
          <DebugToggle />
        </DebugProvider>
      );

      // Assert - State should remain the same
      const toggleAfterRerender = screen.getByTestId('debug-toggle');
      expect(toggleAfterRerender).toHaveTextContent(/Debug OFF/i);
    });
  });

  describe('visual consistency', () => {
    it('should have rounded corners', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle.className).toMatch(/rounded/);
    });

    it('should have padding', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle.className).toMatch(/p[xy]?-/);
    });

    it('should have border', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle.className).toMatch(/border/);
    });

    it('should have transition classes for smooth state changes', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle.className).toMatch(/transition/);
    });

    it('should have flex layout for icon and text alignment', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle.className).toMatch(/flex|inline-flex/);
    });

    it('should have gap between icon and text', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      expect(toggle.className).toMatch(/gap|space/);
    });
  });

  describe('icon rendering', () => {
    it('should display bug icon in OFF state', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      const icon = toggle.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should display bug icon in ON state', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<DebugToggle />);

      const toggle = screen.getByTestId('debug-toggle');

      // Act
      await user.click(toggle);

      // Assert
      const icon = toggle.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have icon with proper size classes', () => {
      // Act
      renderWithProvider(<DebugToggle />);

      // Assert
      const toggle = screen.getByTestId('debug-toggle');
      const icon = toggle.querySelector('svg');
      expect(icon?.getAttribute('class')).toMatch(/[wh]-\d+/);
    });
  });

  describe('error handling', () => {
    it('should throw error when used outside DebugProvider', () => {
      // Act & Assert
      expect(() => render(<DebugToggle />)).toThrow(
        'useDebugContext must be used within a DebugProvider'
      );
    });
  });
});
