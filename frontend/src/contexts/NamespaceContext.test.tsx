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
      <Link to="/workloads">go-workloads</Link>
      <Link to="/nodes">go-nodes</Link>
      <Link to="/namespaces/other-ns/fluxcd/kustomization/app">go-fluxcd-detail</Link>
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

describe('NamespaceContext - kube-style URL deep link', () => {
  it('should default to "all" when the URL has no namespace segment', () => {
    // Arrange & Act
    renderAt('/pods');

    // Assert
    expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^all$/);
    expect(screen.getByTestId('url-pathname')).toHaveTextContent(/^\/pods$/);
  });

  it('should initialize the selection from the /namespaces/<ns> path segment', () => {
    // Arrange & Act
    renderAt('/namespaces/kube-system/pods');

    // Assert
    expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^kube-system$/);
  });

  it('should initialize from a namespace-only path as the scoped overview', () => {
    // Arrange & Act
    renderAt('/namespaces/kube-system');

    // Assert
    expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^kube-system$/);
  });

  it('should rewrite the path to /namespaces/<ns>/... when a namespace is selected', async () => {
    // Arrange
    renderAt('/pods');

    // Act
    fireEvent.click(screen.getByText('select-team-a'));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^team-a$/);
      expect(screen.getByTestId('url-pathname')).toHaveTextContent(/^\/namespaces\/team-a\/pods$/);
    });
  });

  it('should rewrite the overview path to /namespaces/<ns> without a trailing slash', async () => {
    // Arrange
    renderAt('/');

    // Act
    fireEvent.click(screen.getByText('select-team-a'));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('url-pathname')).toHaveTextContent(/^\/namespaces\/team-a$/);
    });
  });

  it('should drop the namespace segment when "all" is selected', async () => {
    // Arrange
    renderAt('/namespaces/team-a/pods');

    // Act
    fireEvent.click(screen.getByText('select-all'));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^all$/);
      expect(screen.getByTestId('url-pathname')).toHaveTextContent(/^\/pods$/);
    });
  });

  it('should keep query params intact when rewriting the path', async () => {
    // Arrange
    renderAt('/pods?foo=bar');

    // Act
    fireEvent.click(screen.getByText('select-team-a'));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('url-pathname')).toHaveTextContent(/^\/namespaces\/team-a\/pods$/);
      expect(screen.getByTestId('url-search')).toHaveTextContent('?foo=bar');
    });
  });

  it('should restore the namespace segment when navigating to a bare tab path', async () => {
    // Arrange
    renderAt('/namespaces/team-a/pods');

    // Act - in-app links use bare tab paths
    fireEvent.click(screen.getByText('go-workloads'));

    // Assert - selection survives and the URL becomes a deep link again
    await waitFor(() => {
      expect(screen.getByTestId('url-pathname')).toHaveTextContent(
        /^\/namespaces\/team-a\/workloads$/
      );
      expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^team-a$/);
    });
  });

  it('should keep cluster-scoped paths unprefixed while preserving the selection', async () => {
    // Arrange - nodes are not namespaced, like in the kube API server
    renderAt('/namespaces/team-a/pods');

    // Act
    fireEvent.click(screen.getByText('go-nodes'));

    // Assert - no /namespaces prefix on /nodes, but the selection is kept
    await waitFor(() => {
      expect(screen.getByTestId('url-pathname')).toHaveTextContent(/^\/nodes$/);
    });
    expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^team-a$/);
  });

  it('should apply a selection made on a cluster-scoped page once back on a namespaced tab', async () => {
    // Arrange
    renderAt('/nodes');

    // Act - select a namespace while on /nodes (URL cannot carry it there)
    fireEvent.click(screen.getByText('select-team-a'));

    // Assert - URL unchanged, selection updated
    expect(screen.getByTestId('url-pathname')).toHaveTextContent(/^\/nodes$/);
    expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^team-a$/);

    // Act - navigate to a namespaced tab
    fireEvent.click(screen.getByText('go-workloads'));

    // Assert - the deep link picks the selection up
    await waitFor(() => {
      expect(screen.getByTestId('url-pathname')).toHaveTextContent(
        /^\/namespaces\/team-a\/workloads$/
      );
    });
  });

  it('should not prefix the path when navigating with "all" selected', async () => {
    // Arrange
    renderAt('/pods');

    // Act
    fireEvent.click(screen.getByText('go-workloads'));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('url-pathname')).toHaveTextContent(/^\/workloads$/);
    });
    expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^all$/);
  });

  it('should not derive the selection from a resource-pinned FluxCD detail URL', () => {
    // Arrange & Act - the segment identifies the resource, not the filter
    renderAt('/namespaces/dashboard-test/fluxcd/kustomization/app');

    // Assert
    expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^all$/);
    expect(screen.getByTestId('url-pathname')).toHaveTextContent(
      /^\/namespaces\/dashboard-test\/fluxcd\/kustomization\/app$/
    );
  });

  it('should keep the selection and the resource URL when entering a FluxCD detail page', async () => {
    // Arrange - list scoped to team-a, detail resource lives in other-ns
    renderAt('/namespaces/team-a/flux');

    // Act
    fireEvent.click(screen.getByText('go-fluxcd-detail'));

    // Assert - resource namespace stays in the URL, global selection untouched
    await waitFor(() => {
      expect(screen.getByTestId('url-pathname')).toHaveTextContent(
        /^\/namespaces\/other-ns\/fluxcd\/kustomization\/app$/
      );
    });
    expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^team-a$/);
  });

  it('should update the selection without rewriting the URL on a FluxCD detail page', async () => {
    // Arrange
    renderAt('/namespaces/dashboard-test/fluxcd/kustomization/app');

    // Act
    fireEvent.click(screen.getByText('select-team-a'));

    // Assert - selection changes, resource URL stays intact
    await waitFor(() => {
      expect(screen.getByTestId('selected-namespace')).toHaveTextContent(/^team-a$/);
    });
    expect(screen.getByTestId('url-pathname')).toHaveTextContent(
      /^\/namespaces\/dashboard-test\/fluxcd\/kustomization\/app$/
    );

    // Act - going back to a namespaced tab applies the pending selection
    fireEvent.click(screen.getByText('go-workloads'));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('url-pathname')).toHaveTextContent(
        /^\/namespaces\/team-a\/workloads$/
      );
    });
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
