import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { NamespaceProvider, useNamespace } from './NamespaceContext';

// Probe component exposing the context value and the current URL
function Probe() {
  const { selectedNamespace, setSelectedNamespace } = useNamespace();
  const location = useLocation();
  return (
    <div>
      <span data-testid="selected-namespace">{selectedNamespace}</span>
      <span data-testid="url-pathname">{location.pathname}</span>
      <span data-testid="url-search">{location.search}</span>
      <button onClick={() => setSelectedNamespace('team-a')}>select-team-a</button>
      <button onClick={() => setSelectedNamespace('all')}>select-all</button>
      <Link to="/nodes">go-nodes</Link>
    </div>
  );
}

const renderAt = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <NamespaceProvider>
        <Routes>
          <Route path="*" element={<Probe />} />
        </Routes>
      </NamespaceProvider>
    </MemoryRouter>
  );

describe('NamespaceContext - URL deep link', () => {
  it('should default to "all" when the URL has no namespace param', () => {
    // Arrange & Act
    renderAt('/pods');

    // Assert
    expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^all$/);
    expect(screen.getByTestId('url-search')).toHaveTextContent('');
  });

  it('should initialize the selection from the ?namespace= URL param', () => {
    // Arrange & Act
    renderAt('/pods?namespace=kube-system');

    // Assert
    expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^kube-system$/);
  });

  it('should treat ?namespace=all in the URL as "All Namespaces"', () => {
    // Arrange & Act
    renderAt('/pods?namespace=all');

    // Assert
    expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^all$/);
  });

  it('should write the selected namespace to the URL', async () => {
    // Arrange
    renderAt('/pods');

    // Act
    fireEvent.click(screen.getByText('select-team-a'));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^team-a$/);
      expect(screen.getByTestId('url-search')).toHaveTextContent('?namespace=team-a');
    });
  });

  it('should remove the namespace param from the URL when "all" is selected', async () => {
    // Arrange
    renderAt('/pods?namespace=team-a');

    // Act
    fireEvent.click(screen.getByText('select-all'));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^all$/);
      expect(screen.getByTestId('url-search')).toHaveTextContent('');
    });
  });

  it('should keep other query params intact when updating the namespace', async () => {
    // Arrange
    renderAt('/pods?foo=bar');

    // Act
    fireEvent.click(screen.getByText('select-team-a'));

    // Assert
    await waitFor(() => {
      const search = screen.getByTestId('url-search').textContent ?? '';
      expect(search).toContain('foo=bar');
      expect(search).toContain('namespace=team-a');
    });
  });

  it('should keep the selection and restore the param when navigating to a link without the query', async () => {
    // Arrange
    renderAt('/pods?namespace=team-a');

    // Act - in-app links carry no query string
    fireEvent.click(screen.getByText('go-nodes'));

    // Assert - selection survives and the URL becomes a deep link again
    await waitFor(() => {
      expect(screen.getByTestId('url-pathname')).toHaveTextContent('/nodes');
      expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^team-a$/);
      expect(screen.getByTestId('url-search')).toHaveTextContent('?namespace=team-a');
    });
  });

  it('should not add a namespace param when navigating with "all" selected', async () => {
    // Arrange
    renderAt('/pods');

    // Act
    fireEvent.click(screen.getByText('go-nodes'));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('url-pathname')).toHaveTextContent('/nodes');
    });
    expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^all$/);
    expect(screen.getByTestId('url-search')).toHaveTextContent('');
  });

  it('should throw when useNamespace is used outside NamespaceProvider', () => {
    // Arrange
    function Orphan() {
      useNamespace();
      return null;
    }

    // Act & Assert
    expect(() => render(<Orphan />)).toThrow(
      'useNamespace must be used within a NamespaceProvider'
    );
  });
});
