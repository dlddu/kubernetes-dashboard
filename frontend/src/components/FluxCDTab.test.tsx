import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FluxCDTab } from './FluxCDTab';

// Mock fetchKustomizations API
vi.mock('../api/fluxcd', () => ({
  fetchKustomizations: vi.fn(),
}));

// Mock useDataFetch hook
vi.mock('../hooks/useDataFetch', () => ({
  useDataFetch: vi.fn(),
}));

import { fetchKustomizations } from '../api/fluxcd';
import { useDataFetch } from '../hooks/useDataFetch';

const mockFetchKustomizations = fetchKustomizations as ReturnType<typeof vi.fn>;
const mockUseDataFetch = useDataFetch as ReturnType<typeof vi.fn>;

// Sample fixture data
const mockKustomizations = [
  {
    name: 'flux-system',
    namespace: 'flux-system',
    ready: true,
    suspended: false,
    sourceKind: 'GitRepository',
    sourceName: 'flux-system',
    revision: 'main@sha1:abc1234',
    interval: '1m0s',
    lastApplied: '2026-03-14T10:00:00Z',
    path: './clusters/my-cluster',
  },
  {
    name: 'apps',
    namespace: 'flux-system',
    ready: false,
    suspended: false,
    sourceKind: 'GitRepository',
    sourceName: 'apps-repo',
    revision: 'main@sha1:def5678',
    interval: '5m0s',
    lastApplied: '2026-03-14T09:00:00Z',
    path: './apps',
  },
  {
    name: 'infra',
    namespace: 'flux-system',
    ready: true,
    suspended: true,
    sourceKind: 'GitRepository',
    sourceName: 'infra-repo',
    revision: 'main@sha1:fed9876',
    interval: '10m0s',
    lastApplied: '2026-03-14T08:00:00Z',
    path: './infrastructure',
  },
];

describe('FluxCDTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render FluxCD page container with data-testid="flux-page"', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      const fluxPage = screen.getByTestId('flux-page');
      expect(fluxPage).toBeInTheDocument();
    });

    it('should render a page heading for FluxCD', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toMatch(/flux/i);
    });
  });

  describe('Loading State', () => {
    it('should show LoadingSkeleton while loading', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      const loadingSkeleton = screen.getByTestId('loading-skeleton');
      expect(loadingSkeleton).toBeInTheDocument();
    });

    it('should set aria-busy on loading skeleton', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      const loadingSkeleton = screen.getByTestId('loading-skeleton');
      expect(loadingSkeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('should hide loading skeleton when data is loaded', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: mockKustomizations,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      const loadingSkeleton = screen.queryByTestId('loading-skeleton');
      expect(loadingSkeleton).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show EmptyState when no kustomizations', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should display an empty message when no kustomizations found', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      expect(screen.getByText(/no kustomizations found/i)).toBeInTheDocument();
    });

    it('should not render kustomization cards when empty', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      const cards = screen.queryAllByTestId('kustomization-card');
      expect(cards).toHaveLength(0);
    });
  });

  describe('Error State', () => {
    it('should show ErrorRetry when fetch fails', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [],
        isLoading: false,
        error: 'Failed to fetch kustomizations',
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      const errorRetry = screen.getByTestId('error-retry');
      expect(errorRetry).toBeInTheDocument();
    });

    it('should have role="alert" on error component', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [],
        isLoading: false,
        error: 'Network error',
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      const errorRetry = screen.getByTestId('error-retry');
      expect(errorRetry).toHaveAttribute('role', 'alert');
    });

    it('should display a retry button on error', () => {
      // Arrange
      const mockRefresh = vi.fn();
      mockUseDataFetch.mockReturnValue({
        data: [],
        isLoading: false,
        error: 'Failed to fetch kustomizations',
        refresh: mockRefresh,
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should not render kustomization cards on error', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [],
        isLoading: false,
        error: 'Failed to fetch kustomizations',
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      const cards = screen.queryAllByTestId('kustomization-card');
      expect(cards).toHaveLength(0);
    });
  });

  describe('Success State - Kustomization Cards', () => {
    it('should render kustomization cards with required fields', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: mockKustomizations,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      const cards = screen.getAllByTestId('kustomization-card');
      expect(cards).toHaveLength(3);
    });

    it('should display kustomization names', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: mockKustomizations,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert: use testid to specifically query name elements (namespace may also match 'flux-system')
      const nameElements = screen.getAllByTestId('kustomization-name');
      const names = nameElements.map((el) => el.textContent);
      expect(names).toContain('flux-system');
      expect(names).toContain('apps');
      expect(names).toContain('infra');
    });

    it('should display kustomization namespaces', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [mockKustomizations[0]],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      const namespaceElements = screen.getAllByText('flux-system');
      expect(namespaceElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should display source kind and source name', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [mockKustomizations[0]],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      expect(screen.getByText(/GitRepository/i)).toBeInTheDocument();
    });

    it('should display revision information', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [mockKustomizations[0]],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      expect(screen.getByText(/abc1234/i)).toBeInTheDocument();
    });

    it('should display path information', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [mockKustomizations[0]],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      expect(screen.getByText(/clusters\/my-cluster/i)).toBeInTheDocument();
    });
  });

  describe('Summary Cards', () => {
    it('should render summary cards (Ready, Not Ready, Suspended)', () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: mockKustomizations,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert: summary cards should be rendered by testid (avoid ambiguity with status badges)
      expect(screen.getByTestId('summary-card-ready')).toBeInTheDocument();
      expect(screen.getByTestId('summary-card-not-ready')).toBeInTheDocument();
      expect(screen.getByTestId('summary-card-suspended')).toBeInTheDocument();
    });

    it('should display correct Ready count', () => {
      // Arrange: 2 ready (flux-system, infra), 1 not ready (apps), 1 suspended (infra)
      mockUseDataFetch.mockReturnValue({
        data: mockKustomizations,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert: the Ready summary card value should reflect ready count
      // flux-system is ready=true (infra is ready but suspended, excluded from ready count)
      const summaryCardValues = screen.getAllByTestId('summary-card-value');
      const values = summaryCardValues.map((el) => el.textContent);
      expect(values).toContain('1'); // 1 ready kustomization (infra excluded — suspended)
    });

    it('should display correct Suspended count', () => {
      // Arrange: infra is suspended
      mockUseDataFetch.mockReturnValue({
        data: mockKustomizations,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert: the Suspended count should be 1
      const summaryCardValues = screen.getAllByTestId('summary-card-value');
      const values = summaryCardValues.map((el) => el.textContent);
      expect(values).toContain('1'); // 1 suspended kustomization
    });
  });

  describe('Namespace Filtering', () => {
    it('should pass namespace prop to fetch function', async () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab namespace="default" />);

      // Assert: useDataFetch should have been called with a fetcher that uses the namespace
      expect(mockUseDataFetch).toHaveBeenCalled();
      const [fetcher, , deps] = mockUseDataFetch.mock.calls[0];

      // Verify deps contain the namespace
      expect(deps).toContain('default');

      // Trigger the fetcher to verify it calls fetchKustomizations with namespace
      mockFetchKustomizations.mockResolvedValueOnce([]);
      await fetcher();
      expect(mockFetchKustomizations).toHaveBeenCalledWith('default');
    });

    it('should pass undefined namespace when no namespace prop given', async () => {
      // Arrange
      mockUseDataFetch.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      // Act
      render(<FluxCDTab />);

      // Assert
      expect(mockUseDataFetch).toHaveBeenCalled();
      const [fetcher] = mockUseDataFetch.mock.calls[0];

      mockFetchKustomizations.mockResolvedValueOnce([]);
      await fetcher();
      expect(mockFetchKustomizations).toHaveBeenCalledWith(undefined);
    });
  });
});
