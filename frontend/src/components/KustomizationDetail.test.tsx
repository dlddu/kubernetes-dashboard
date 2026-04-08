import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports of the mocked modules
// ---------------------------------------------------------------------------

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));

vi.mock('../api/fluxcd', () => ({
  fetchKustomizationDetail: vi.fn(),
  fetchKustomizations: vi.fn(),
  reconcileKustomization: vi.fn(),
  suspendKustomization: vi.fn(),
  resumeKustomization: vi.fn(),
}));

vi.mock('../hooks/usePolling', () => ({
  usePolling: () => ({ refresh: vi.fn(), lastUpdate: new Date(), isLoading: false }),
}));

import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchKustomizationDetail,
  reconcileKustomization,
  suspendKustomization,
  resumeKustomization,
} from '../api/fluxcd';
import { KustomizationDetailPage } from './KustomizationDetailPage';

// ---------------------------------------------------------------------------
// Typed mock helpers
// ---------------------------------------------------------------------------

const mockUseParams = useParams as ReturnType<typeof vi.fn>;
const mockUseNavigate = useNavigate as ReturnType<typeof vi.fn>;
const mockFetchKustomizationDetail = fetchKustomizationDetail as ReturnType<typeof vi.fn>;
const mockReconcileKustomization = reconcileKustomization as ReturnType<typeof vi.fn>;
const mockSuspendKustomization = suspendKustomization as ReturnType<typeof vi.fn>;
const mockResumeKustomization = resumeKustomization as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const mockDetail = {
  name: 'flux-system',
  namespace: 'flux-system',
  suspended: false,
  spec: {
    interval: '1m0s',
    path: './clusters/my-cluster',
    prune: true,
    sourceRef: {
      kind: 'GitRepository',
      name: 'flux-system',
      namespace: 'flux-system',
    },
    dependsOn: [],
  },
  status: {
    lastAppliedRevision: 'main@sha1:abc1234567890abcdef',
    conditions: [
      {
        type: 'Ready',
        status: 'True',
        reason: 'ReconciliationSucceeded',
        message: 'Applied revision: main@sha1:abc1234567890abcdef',
        lastTransitionTime: '2026-03-14T10:00:00Z',
      },
      {
        type: 'Reconciling',
        status: 'False',
        reason: 'ReconciliationSucceeded',
        message: '',
        lastTransitionTime: '2026-03-14T10:00:00Z',
      },
    ],
  },
};

const mockDetailWithDependsOn = {
  ...mockDetail,
  spec: {
    ...mockDetail.spec,
    dependsOn: [
      { name: 'infra', namespace: 'flux-system' },
      { name: 'crds', namespace: '' },
    ],
  },
};

const mockDetailSuspended = {
  ...mockDetail,
  name: 'suspended-app',
  suspended: true,
};

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // Default router mock values
  mockUseParams.mockReturnValue({ namespace: 'flux-system', name: 'flux-system' });
  mockUseNavigate.mockReturnValue(vi.fn());
});

// ---------------------------------------------------------------------------
// Helper: render component and wait for loading to complete
// ---------------------------------------------------------------------------

async function renderAndWait() {
  const utils = render(<KustomizationDetailPage />);
  // Wait for the initial loading skeleton to disappear
  await waitFor(() => {
    expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
  });
  return utils;
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('KustomizationDetailPage', () => {
  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  describe('Loading State', () => {
    it('should show loading skeleton while fetching', async () => {
      // Arrange: fetch never resolves during this test
      let resolvePromise!: (value: typeof mockDetail) => void;
      mockFetchKustomizationDetail.mockReturnValue(
        new Promise<typeof mockDetail>((res) => {
          resolvePromise = res;
        })
      );

      // Act
      render(<KustomizationDetailPage />);

      // Assert: skeleton is visible immediately
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();

      // Cleanup: resolve to avoid act() warning
      await act(async () => {
        resolvePromise(mockDetail);
      });
    });

    it('should hide loading skeleton after fetch resolves', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    it('should call fetchKustomizationDetail with correct namespace and name', async () => {
      // Arrange
      mockUseParams.mockReturnValue({ namespace: 'production', name: 'my-app' });
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      expect(mockFetchKustomizationDetail).toHaveBeenCalledWith('production', 'my-app');
    });
  });

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  describe('Error State', () => {
    it('should show error retry component when fetch fails', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockRejectedValue(new Error('Network error'));

      // Act
      await renderAndWait();

      // Assert
      expect(screen.getByTestId('error-retry')).toBeInTheDocument();
    });

    it('should display retry button on error', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockRejectedValue(new Error('Failed to fetch'));

      // Act
      await renderAndWait();

      // Assert
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should retry fetch when retry button is clicked', async () => {
      // Arrange: first call fails, second succeeds
      mockFetchKustomizationDetail
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockDetail);

      await renderAndWait();

      const retryButton = screen.getByRole('button', { name: /retry/i });

      // Act
      await act(async () => {
        fireEvent.click(retryButton);
      });

      // Assert: fetch called twice (initial + retry)
      await waitFor(() => {
        expect(mockFetchKustomizationDetail).toHaveBeenCalledTimes(2);
      });
    });

    it('should not show spec content on error', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockRejectedValue(new Error('Error'));

      // Act
      await renderAndWait();

      // Assert
      expect(screen.queryByTestId('kustomization-detail-spec-path')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Back button
  // -------------------------------------------------------------------------
  describe('Back Button', () => {
    it('should render back button', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      expect(screen.getByTestId('kustomization-detail-back-button')).toBeInTheDocument();
    });

    it('should navigate to /flux when back button is clicked', async () => {
      // Arrange
      const mockNavigate = vi.fn();
      mockUseNavigate.mockReturnValue(mockNavigate);
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();
      fireEvent.click(screen.getByTestId('kustomization-detail-back-button'));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith('/flux');
    });

    it('should show back button even during loading', () => {
      // Arrange: never-resolving fetch
      mockFetchKustomizationDetail.mockReturnValue(new Promise(() => {}));

      // Act
      render(<KustomizationDetailPage />);

      // Assert
      expect(screen.getByTestId('kustomization-detail-back-button')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Main container
  // -------------------------------------------------------------------------
  describe('Main Container', () => {
    it('should render main page container with correct testId', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      expect(screen.getByTestId('kustomization-detail-page')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Spec card
  // -------------------------------------------------------------------------
  describe('Spec Card', () => {
    it('should display spec source information', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      const sourceEl = screen.getByTestId('kustomization-detail-spec-source');
      expect(sourceEl).toBeInTheDocument();
      expect(sourceEl.textContent).toMatch(/GitRepository/);
      expect(sourceEl.textContent).toMatch(/flux-system/);
    });

    it('should display spec path', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      const pathEl = screen.getByTestId('kustomization-detail-spec-path');
      expect(pathEl).toBeInTheDocument();
      expect(pathEl.textContent).toContain('./clusters/my-cluster');
    });

    it('should display spec interval', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      const intervalEl = screen.getByTestId('kustomization-detail-spec-interval');
      expect(intervalEl).toBeInTheDocument();
      expect(intervalEl.textContent).toContain('1m0s');
    });

    it('should display spec prune', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      const pruneEl = screen.getByTestId('kustomization-detail-spec-prune');
      expect(pruneEl).toBeInTheDocument();
    });

    it('should display suspended status', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      const suspendedEl = screen.getByTestId('kustomization-detail-spec-suspended');
      expect(suspendedEl).toBeInTheDocument();
    });

    it('should show suspended=true correctly', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetailSuspended);

      // Act
      await renderAndWait();

      // Assert
      const suspendedEl = screen.getByTestId('kustomization-detail-spec-suspended');
      expect(suspendedEl.textContent).toMatch(/true/i);
    });

    it('should show suspended=false correctly', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      const suspendedEl = screen.getByTestId('kustomization-detail-spec-suspended');
      expect(suspendedEl.textContent).toMatch(/false/i);
    });

    it('should display dependsOn section', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetailWithDependsOn);

      // Act
      await renderAndWait();

      // Assert
      const dependsOnEl = screen.getByTestId('kustomization-detail-spec-depends-on');
      expect(dependsOnEl).toBeInTheDocument();
      expect(dependsOnEl.textContent).toContain('infra');
    });

    it('should display dependsOn section even when there are no dependencies', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert: element always exists
      const dependsOnEl = screen.getByTestId('kustomization-detail-spec-depends-on');
      expect(dependsOnEl).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Status card
  // -------------------------------------------------------------------------
  describe('Status Card', () => {
    it('should display last applied revision', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      const revisionEl = screen.getByTestId('kustomization-detail-status-revision');
      expect(revisionEl).toBeInTheDocument();
      expect(revisionEl.textContent).toContain('main@sha1:abc1234567890abcdef');
    });

    it('should render revision element with font-mono class', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert: monospace class required per spec
      const revisionEl = screen.getByTestId('kustomization-detail-status-revision');
      expect(revisionEl.className).toContain('font-mono');
    });

    it('should display last applied time section', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      const lastAppliedEl = screen.getByTestId('kustomization-detail-status-last-applied');
      expect(lastAppliedEl).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Conditions card
  // -------------------------------------------------------------------------
  describe('Conditions Card', () => {
    it('should render the conditions section container', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      expect(screen.getByTestId('kustomization-detail-conditions')).toBeInTheDocument();
    });

    it('should render the correct number of condition rows', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert: fixture has 2 conditions
      const conditionRows = screen.getAllByTestId('kustomization-detail-condition');
      expect(conditionRows).toHaveLength(2);
    });

    it('should display condition Type for each condition', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      const typeEls = screen.getAllByTestId('kustomization-detail-condition-type');
      const typeTexts = typeEls.map((el) => el.textContent);
      expect(typeTexts).toContain('Ready');
      expect(typeTexts).toContain('Reconciling');
    });

    it('should display condition Status for each condition', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      const statusEls = screen.getAllByTestId('kustomization-detail-condition-status');
      const statusTexts = statusEls.map((el) => el.textContent);
      expect(statusTexts).toContain('True');
      expect(statusTexts).toContain('False');
    });

    it('should display condition Reason for each condition', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      const reasonEls = screen.getAllByTestId('kustomization-detail-condition-reason');
      const reasonTexts = reasonEls.map((el) => el.textContent);
      expect(reasonTexts).toContain('ReconciliationSucceeded');
    });

    it('should display condition Message for each condition', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      const messageEls = screen.getAllByTestId('kustomization-detail-condition-message');
      const messageTexts = messageEls.map((el) => el.textContent);
      expect(messageTexts).toContain('Applied revision: main@sha1:abc1234567890abcdef');
    });

    it('should apply green class for status=True condition', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert: the "Ready" condition has status=True → some element with green class
      const conditionRows = screen.getAllByTestId('kustomization-detail-condition');
      const readyRow = conditionRows.find(
        (row) =>
          row.querySelector('[data-testid="kustomization-detail-condition-type"]')?.textContent ===
          'Ready'
      );
      expect(readyRow).toBeDefined();
      expect(readyRow!.innerHTML).toMatch(/green/);
    });

    it('should apply red class for status=False condition', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert: the "Reconciling" condition has status=False → red class
      const conditionRows = screen.getAllByTestId('kustomization-detail-condition');
      const reconcilingRow = conditionRows.find(
        (row) =>
          row.querySelector('[data-testid="kustomization-detail-condition-type"]')?.textContent ===
          'Reconciling'
      );
      expect(reconcilingRow).toBeDefined();
      expect(reconcilingRow!.innerHTML).toMatch(/red/);
    });

    it('should render empty conditions section when conditions array is empty', async () => {
      // Arrange
      const detailNoConditions = {
        ...mockDetail,
        status: { ...mockDetail.status, conditions: [] },
      };
      mockFetchKustomizationDetail.mockResolvedValue(detailNoConditions);

      // Act
      await renderAndWait();

      // Assert: section container exists but has no condition rows
      expect(screen.getByTestId('kustomization-detail-conditions')).toBeInTheDocument();
      expect(screen.queryAllByTestId('kustomization-detail-condition')).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Reconcile Button
  // -------------------------------------------------------------------------
  describe('Reconcile Button', () => {
    it('should render Reconcile Now button when detail is loaded', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      expect(screen.getByTestId('reconcile-button')).toBeInTheDocument();
      expect(screen.getByTestId('reconcile-button').textContent).toMatch(/Reconcile Now/i);
    });

    it('should show Reconciling... text and disable button when clicked', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);
      // reconcileKustomization never resolves during this test so we stay in the reconciling state
      mockReconcileKustomization.mockReturnValue(new Promise(() => {}));

      await renderAndWait();

      const button = screen.getByTestId('reconcile-button');

      // Act
      await act(async () => {
        fireEvent.click(button);
      });

      // Assert
      expect(screen.getByTestId('reconcile-button').textContent).toMatch(/Reconciling\.\.\./i);
      expect(screen.getByTestId('reconcile-button')).toBeDisabled();
    });

    it('should show spinner while reconciling', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);
      mockReconcileKustomization.mockReturnValue(new Promise(() => {}));

      await renderAndWait();

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('reconcile-button'));
      });

      // Assert
      expect(screen.getByTestId('reconcile-spinner')).toBeInTheDocument();
    });

    it('should re-enable button after successful reconcile', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);
      mockReconcileKustomization.mockResolvedValue(undefined);

      await renderAndWait();

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('reconcile-button'));
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('reconcile-button')).not.toBeDisabled();
      });
    });

    it('should call reconcileKustomization with correct namespace and name', async () => {
      // Arrange
      mockUseParams.mockReturnValue({ namespace: 'flux-system', name: 'flux-system' });
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);
      mockReconcileKustomization.mockResolvedValue(undefined);

      await renderAndWait();

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('reconcile-button'));
      });

      // Assert
      expect(mockReconcileKustomization).toHaveBeenCalledWith('flux-system', 'flux-system');
    });

    it('should refresh detail data after successful reconcile', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);
      mockReconcileKustomization.mockResolvedValue(undefined);

      await renderAndWait();

      const initialCallCount = mockFetchKustomizationDetail.mock.calls.length;

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('reconcile-button'));
      });

      // Assert: fetchKustomizationDetail called again to refresh
      await waitFor(() => {
        expect(mockFetchKustomizationDetail.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('should show error message when reconcile fails', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);
      mockReconcileKustomization.mockRejectedValue(new Error('Reconcile failed'));

      await renderAndWait();

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('reconcile-button'));
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('reconcile-error')).toBeInTheDocument();
      });
    });

    it('should have role="alert" on error element', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);
      mockReconcileKustomization.mockRejectedValue(new Error('Reconcile failed'));

      await renderAndWait();

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('reconcile-button'));
      });

      // Assert
      await waitFor(() => {
        const errorEl = screen.getByTestId('reconcile-error');
        expect(errorEl).toHaveAttribute('role', 'alert');
      });
    });

    it('should re-enable button after reconcile failure', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);
      mockReconcileKustomization.mockRejectedValue(new Error('Reconcile failed'));

      await renderAndWait();

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('reconcile-button'));
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('reconcile-button')).not.toBeDisabled();
      });
    });

    it('should hide spinner after reconcile failure', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);
      mockReconcileKustomization.mockRejectedValue(new Error('Reconcile failed'));

      await renderAndWait();

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('reconcile-button'));
      });

      // Assert
      await waitFor(() => {
        expect(screen.queryByTestId('reconcile-spinner')).not.toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Suspend / Resume Toggle Button
  // -------------------------------------------------------------------------
  describe('Suspend / Resume Toggle Button', () => {
    it('should render Suspend button when kustomization is not suspended', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      const button = screen.getByTestId('suspend-toggle-button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toMatch(/^Suspend$/);
    });

    it('should render Resume button when kustomization is suspended', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetailSuspended);

      // Act
      await renderAndWait();

      // Assert
      const button = screen.getByTestId('suspend-toggle-button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toMatch(/^Resume$/);
    });

    it('should call suspendKustomization when clicked while not suspended', async () => {
      // Arrange
      mockUseParams.mockReturnValue({ namespace: 'flux-system', name: 'flux-system' });
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);
      mockSuspendKustomization.mockResolvedValue(undefined);

      await renderAndWait();

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('suspend-toggle-button'));
      });

      // Assert
      expect(mockSuspendKustomization).toHaveBeenCalledWith('flux-system', 'flux-system');
      expect(mockResumeKustomization).not.toHaveBeenCalled();
    });

    it('should call resumeKustomization when clicked while suspended', async () => {
      // Arrange
      mockUseParams.mockReturnValue({ namespace: 'flux-system', name: 'suspended-app' });
      mockFetchKustomizationDetail.mockResolvedValue(mockDetailSuspended);
      mockResumeKustomization.mockResolvedValue(undefined);

      await renderAndWait();

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('suspend-toggle-button'));
      });

      // Assert
      expect(mockResumeKustomization).toHaveBeenCalledWith('flux-system', 'suspended-app');
      expect(mockSuspendKustomization).not.toHaveBeenCalled();
    });

    it('should show Suspending... text and disable button when suspending', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);
      mockSuspendKustomization.mockReturnValue(new Promise(() => {}));

      await renderAndWait();

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('suspend-toggle-button'));
      });

      // Assert
      const button = screen.getByTestId('suspend-toggle-button');
      expect(button.textContent).toMatch(/Suspending\.\.\./i);
      expect(button).toBeDisabled();
    });

    it('should show Resuming... text and disable button when resuming', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetailSuspended);
      mockResumeKustomization.mockReturnValue(new Promise(() => {}));

      await renderAndWait();

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('suspend-toggle-button'));
      });

      // Assert
      const button = screen.getByTestId('suspend-toggle-button');
      expect(button.textContent).toMatch(/Resuming\.\.\./i);
      expect(button).toBeDisabled();
    });

    it('should re-enable button after successful suspend', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);
      mockSuspendKustomization.mockResolvedValue(undefined);

      await renderAndWait();

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('suspend-toggle-button'));
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('suspend-toggle-button')).not.toBeDisabled();
      });
    });

    it('should refresh detail data after successful suspend', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);
      mockSuspendKustomization.mockResolvedValue(undefined);

      await renderAndWait();

      const initialCallCount = mockFetchKustomizationDetail.mock.calls.length;

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('suspend-toggle-button'));
      });

      // Assert
      await waitFor(() => {
        expect(mockFetchKustomizationDetail.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('should show error message when suspend fails', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);
      mockSuspendKustomization.mockRejectedValue(new Error('Suspend failed'));

      await renderAndWait();

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('suspend-toggle-button'));
      });

      // Assert
      await waitFor(() => {
        const errorEl = screen.getByTestId('suspend-error');
        expect(errorEl).toBeInTheDocument();
        expect(errorEl).toHaveAttribute('role', 'alert');
        expect(errorEl.textContent).toContain('Suspend failed');
      });
    });

    it('should show error message when resume fails', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetailSuspended);
      mockResumeKustomization.mockRejectedValue(new Error('Resume failed'));

      await renderAndWait();

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('suspend-toggle-button'));
      });

      // Assert
      await waitFor(() => {
        const errorEl = screen.getByTestId('suspend-error');
        expect(errorEl).toBeInTheDocument();
        expect(errorEl.textContent).toContain('Resume failed');
      });
    });

    it('should re-enable button after suspend failure', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);
      mockSuspendKustomization.mockRejectedValue(new Error('Suspend failed'));

      await renderAndWait();

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('suspend-toggle-button'));
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('suspend-toggle-button')).not.toBeDisabled();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle kustomization with empty revision without crashing', async () => {
      // Arrange
      const detailEmptyRevision = {
        ...mockDetail,
        status: { ...mockDetail.status, lastAppliedRevision: '' },
      };
      mockFetchKustomizationDetail.mockResolvedValue(detailEmptyRevision);

      // Act
      await renderAndWait();

      // Assert: revision element still renders
      expect(screen.getByTestId('kustomization-detail-status-revision')).toBeInTheDocument();
    });

    it('should show all three conditions when present', async () => {
      // Arrange
      const detailThreeConditions = {
        ...mockDetail,
        status: {
          ...mockDetail.status,
          conditions: [
            ...mockDetail.status.conditions,
            {
              type: 'HealthChecks',
              status: 'True',
              reason: 'Passed',
              message: 'All health checks passed',
              lastTransitionTime: '2026-03-14T11:00:00Z',
            },
          ],
        },
      };
      mockFetchKustomizationDetail.mockResolvedValue(detailThreeConditions);

      // Act
      await renderAndWait();

      // Assert
      expect(screen.getAllByTestId('kustomization-detail-condition')).toHaveLength(3);
    });

    it('should use namespace and name from URL params for the API call', async () => {
      // Arrange
      mockUseParams.mockReturnValue({ namespace: 'staging', name: 'my-kustomization' });
      mockFetchKustomizationDetail.mockResolvedValue(mockDetail);

      // Act
      await renderAndWait();

      // Assert
      expect(mockFetchKustomizationDetail).toHaveBeenCalledWith('staging', 'my-kustomization');
    });

    it('should display multiple dependsOn entries', async () => {
      // Arrange
      mockFetchKustomizationDetail.mockResolvedValue(mockDetailWithDependsOn);

      // Act
      await renderAndWait();

      // Assert
      const dependsOnEl = screen.getByTestId('kustomization-detail-spec-depends-on');
      expect(dependsOnEl.textContent).toContain('infra');
      expect(dependsOnEl.textContent).toContain('crds');
    });
  });
});
