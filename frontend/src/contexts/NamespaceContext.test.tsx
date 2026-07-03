import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { NamespaceProvider, useNamespace, NAMESPACE_QUERY_PARAM } from './NamespaceContext';

function NamespaceProbe() {
  const { selectedNamespace, setSelectedNamespace } = useNamespace();
  const location = useLocation();

  return (
    <div>
      <span data-testid="selected-namespace">{selectedNamespace}</span>
      <span data-testid="current-search">{location.search}</span>
      <span data-testid="current-path">{location.pathname}</span>
      <button onClick={() => setSelectedNamespace('kube-system')}>select-kube-system</button>
      <button onClick={() => setSelectedNamespace('all')}>select-all</button>
      <Link to="/pods">go-pods</Link>
    </div>
  );
}

const renderAt = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <NamespaceProvider>
        <Routes>
          <Route path="*" element={<NamespaceProbe />} />
        </Routes>
      </NamespaceProvider>
    </MemoryRouter>
  );

describe('NamespaceContext - URL deep link', () => {
  it('defaults to "all" when the URL has no namespace param', () => {
    renderAt('/');

    expect(screen.getByTestId('selected-namespace')).toHaveTextContent('all');
    expect(screen.getByTestId('current-search')).toHaveTextContent('');
  });

  it('initializes the selected namespace from the URL param', () => {
    renderAt(`/pods?${NAMESPACE_QUERY_PARAM}=kube-system`);

    expect(screen.getByTestId('selected-namespace')).toHaveTextContent('kube-system');
  });

  it('writes the selected namespace to the URL param', () => {
    renderAt('/');

    fireEvent.click(screen.getByText('select-kube-system'));

    expect(screen.getByTestId('selected-namespace')).toHaveTextContent('kube-system');
    expect(screen.getByTestId('current-search')).toHaveTextContent(
      `?${NAMESPACE_QUERY_PARAM}=kube-system`
    );
  });

  it('removes the URL param when "all" is selected', () => {
    renderAt(`/?${NAMESPACE_QUERY_PARAM}=kube-system`);

    fireEvent.click(screen.getByText('select-all'));

    expect(screen.getByTestId('selected-namespace')).toHaveTextContent('all');
    expect(screen.getByTestId('current-search').textContent).toBe('');
  });

  it('restores the namespace param after navigation drops it', () => {
    renderAt('/');

    fireEvent.click(screen.getByText('select-kube-system'));
    fireEvent.click(screen.getByText('go-pods'));

    expect(screen.getByTestId('current-path')).toHaveTextContent('/pods');
    expect(screen.getByTestId('selected-namespace')).toHaveTextContent('kube-system');
    expect(screen.getByTestId('current-search')).toHaveTextContent(
      `?${NAMESPACE_QUERY_PARAM}=kube-system`
    );
  });

  it('treats an empty namespace param as "all"', () => {
    renderAt(`/?${NAMESPACE_QUERY_PARAM}=`);

    expect(screen.getByTestId('selected-namespace')).toHaveTextContent('all');
  });

  it('preserves unrelated query params when updating the namespace', () => {
    renderAt('/?foo=bar');

    fireEvent.click(screen.getByText('select-kube-system'));

    const search = screen.getByTestId('current-search').textContent ?? '';
    expect(search).toContain('foo=bar');
    expect(search).toContain(`${NAMESPACE_QUERY_PARAM}=kube-system`);
  });
});
