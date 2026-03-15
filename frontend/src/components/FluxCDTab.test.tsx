import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FluxCDTab } from './FluxCDTab';

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

// Mock fetchKustomizations and fetchGitRepositories API
vi.mock('../api/fluxcd', () => ({
  fetchKustomizations: vi.fn(),
  fetchGitRepositories: vi.fn(),
}));

// Mock useDataFetch hook
vi.mock('../hooks/useDataFetch', () => ({
  useDataFetch: vi.fn(),
}));

import { fetchKustomizations, fetchGitRepositories } from '../api/fluxcd';
import { useDataFetch } from '../hooks/useDataFetch';

const mockFetchKustomizations = fetchKustomizations as ReturnType<typeof vi.fn>;
const mockFetchGitRepositories = fetchGitRepositories as ReturnType<typeof vi.fn>;
const mockUseDataFetch = useDataFetch as ReturnType<typeof vi.fn>;

const emptyResult = {
  data: [],
  isLoading: false,
  error: null,
  refresh: vi.fn(),
};

/** Helper: mock useDataFetch for both kustomizations (1st call) and git repos (2nd call). */
function mockBothFetches(
  kustomizationResult: object = emptyResult,
  gitRepoResult: object = emptyResult,
) {
  mockUseDataFetch
    .mockReturnValueOnce(kustomizationResult)
    .mockReturnValueOnce(gitRepoResult);
}

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
      mockBothFetches();
      render(<FluxCDTab />);
      const fluxPage = screen.getByTestId('flux-page');
      expect(fluxPage).toBeInTheDocument();
    });

    it('should render page headings for FluxCD', () => {
      mockBothFetches();
      render(<FluxCDTab />);
      const headings = screen.getAllByRole('heading', { level: 1 });
      expect(headings.length).toBeGreaterThanOrEqual(1);
      expect(headings.some((h) => /flux/i.test(h.textContent || ''))).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('should show LoadingSkeleton while loading', () => {
      mockBothFetches(
        { data: [], isLoading: true, error: null, refresh: vi.fn() },
        { data: [], isLoading: true, error: null, refresh: vi.fn() },
      );
      render(<FluxCDTab />);
      const loadingSkeletons = screen.getAllByTestId('loading-skeleton');
      expect(loadingSkeletons.length).toBeGreaterThanOrEqual(1);
    });

    it('should set aria-busy on loading skeleton', () => {
      mockBothFetches(
        { data: [], isLoading: true, error: null, refresh: vi.fn() },
        { data: [], isLoading: true, error: null, refresh: vi.fn() },
      );
      render(<FluxCDTab />);
      const loadingSkeletons = screen.getAllByTestId('loading-skeleton');
      expect(loadingSkeletons[0]).toHaveAttribute('aria-busy', 'true');
    });

    it('should hide loading skeleton when data is loaded', () => {
      mockBothFetches(
        { data: mockKustomizations, isLoading: false, error: null, refresh: vi.fn() },
      );
      render(<FluxCDTab />);
      const loadingSkeleton = screen.queryByTestId('loading-skeleton');
      expect(loadingSkeleton).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show EmptyState when no kustomizations', () => {
      mockBothFetches();
      render(<FluxCDTab />);
      const emptyStates = screen.getAllByTestId('empty-state');
      expect(emptyStates.length).toBeGreaterThanOrEqual(1);
    });

    it('should display an empty message when no kustomizations found', () => {
      mockBothFetches();
      render(<FluxCDTab />);
      expect(screen.getByText(/no kustomizations found/i)).toBeInTheDocument();
    });

    it('should not render kustomization cards when empty', () => {
      mockBothFetches();
      render(<FluxCDTab />);
      const cards = screen.queryAllByTestId('kustomization-card');
      expect(cards).toHaveLength(0);
    });
  });

  describe('Error State', () => {
    it('should show ErrorRetry when fetch fails', () => {
      mockBothFetches(
        { data: [], isLoading: false, error: 'Failed to fetch kustomizations', refresh: vi.fn() },
      );
      render(<FluxCDTab />);
      const errorRetry = screen.getByTestId('error-retry');
      expect(errorRetry).toBeInTheDocument();
    });

    it('should have role="alert" on error component', () => {
      mockBothFetches(
        { data: [], isLoading: false, error: 'Network error', refresh: vi.fn() },
      );
      render(<FluxCDTab />);
      const errorRetry = screen.getByTestId('error-retry');
      expect(errorRetry).toHaveAttribute('role', 'alert');
    });

    it('should display a retry button on error', () => {
      const mockRefresh = vi.fn();
      mockBothFetches(
        { data: [], isLoading: false, error: 'Failed to fetch kustomizations', refresh: mockRefresh },
      );
      render(<FluxCDTab />);
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should not render kustomization cards on error', () => {
      mockBothFetches(
        { data: [], isLoading: false, error: 'Failed to fetch kustomizations', refresh: vi.fn() },
      );
      render(<FluxCDTab />);
      const cards = screen.queryAllByTestId('kustomization-card');
      expect(cards).toHaveLength(0);
    });
  });

  describe('Success State - Kustomization Cards', () => {
    it('should render kustomization cards with required fields', () => {
      mockBothFetches(
        { data: mockKustomizations, isLoading: false, error: null, refresh: vi.fn() },
      );
      render(<FluxCDTab />);
      const cards = screen.getAllByTestId('kustomization-card');
      expect(cards).toHaveLength(3);
    });

    it('should display kustomization names', () => {
      mockBothFetches(
        { data: mockKustomizations, isLoading: false, error: null, refresh: vi.fn() },
      );
      render(<FluxCDTab />);
      const nameElements = screen.getAllByTestId('kustomization-name');
      const names = nameElements.map((el) => el.textContent);
      expect(names).toContain('flux-system');
      expect(names).toContain('apps');
      expect(names).toContain('infra');
    });

    it('should display kustomization namespaces', () => {
      mockBothFetches(
        { data: [mockKustomizations[0]], isLoading: false, error: null, refresh: vi.fn() },
      );
      render(<FluxCDTab />);
      const namespaceElements = screen.getAllByText('flux-system');
      expect(namespaceElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should display source kind and source name', () => {
      mockBothFetches(
        { data: [mockKustomizations[0]], isLoading: false, error: null, refresh: vi.fn() },
      );
      render(<FluxCDTab />);
      expect(screen.getByText(/GitRepository\/flux-system/i)).toBeInTheDocument();
    });

    it('should display revision information', () => {
      mockBothFetches(
        { data: [mockKustomizations[0]], isLoading: false, error: null, refresh: vi.fn() },
      );
      render(<FluxCDTab />);
      expect(screen.getByText(/abc1234/i)).toBeInTheDocument();
    });

    it('should display path information', () => {
      mockBothFetches(
        { data: [mockKustomizations[0]], isLoading: false, error: null, refresh: vi.fn() },
      );
      render(<FluxCDTab />);
      expect(screen.getByText(/clusters\/my-cluster/i)).toBeInTheDocument();
    });
  });

  describe('Summary Cards', () => {
    it('should render summary cards (Ready, Not Ready, Suspended)', () => {
      mockBothFetches(
        { data: mockKustomizations, isLoading: false, error: null, refresh: vi.fn() },
      );
      render(<FluxCDTab />);
      expect(screen.getByTestId('summary-card-ready')).toBeInTheDocument();
      expect(screen.getByTestId('summary-card-not-ready')).toBeInTheDocument();
      expect(screen.getByTestId('summary-card-suspended')).toBeInTheDocument();
    });

    it('should display correct Ready count', () => {
      mockBothFetches(
        { data: mockKustomizations, isLoading: false, error: null, refresh: vi.fn() },
      );
      render(<FluxCDTab />);
      const summaryCardValues = screen.getAllByTestId('summary-card-value');
      const values = summaryCardValues.map((el) => el.textContent);
      expect(values).toContain('1'); // 1 ready kustomization (infra excluded — suspended)
    });

    it('should display correct Suspended count', () => {
      mockBothFetches(
        { data: mockKustomizations, isLoading: false, error: null, refresh: vi.fn() },
      );
      render(<FluxCDTab />);
      const summaryCardValues = screen.getAllByTestId('summary-card-value');
      const values = summaryCardValues.map((el) => el.textContent);
      expect(values).toContain('1'); // 1 suspended kustomization
    });
  });

  describe('Namespace Filtering', () => {
    it('should pass namespace prop to fetch function', async () => {
      mockBothFetches();
      render(<FluxCDTab namespace="default" />);
      expect(mockUseDataFetch).toHaveBeenCalled();
      const [fetcher, , deps] = mockUseDataFetch.mock.calls[0];
      expect(deps).toContain('default');
      mockFetchKustomizations.mockResolvedValueOnce([]);
      await fetcher();
      expect(mockFetchKustomizations).toHaveBeenCalledWith('default');
    });

    it('should pass undefined namespace when no namespace prop given', async () => {
      mockBothFetches();
      render(<FluxCDTab />);
      expect(mockUseDataFetch).toHaveBeenCalled();
      const [fetcher] = mockUseDataFetch.mock.calls[0];
      mockFetchKustomizations.mockResolvedValueOnce([]);
      await fetcher();
      expect(mockFetchKustomizations).toHaveBeenCalledWith(undefined);
    });
  });
});
