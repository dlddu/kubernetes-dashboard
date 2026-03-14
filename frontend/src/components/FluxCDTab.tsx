import { fetchKustomizations, KustomizationInfo } from '../api/fluxcd';
import { useDataFetch } from '../hooks/useDataFetch';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { ErrorRetry } from './ErrorRetry';
import { SummaryCard } from './SummaryCard';
import { StatusBadge } from './StatusBadge';

interface FluxCDTabProps {
  namespace?: string;
}

export function FluxCDTab({ namespace }: FluxCDTabProps) {
  const { data: kustomizations, isLoading, error, refresh } = useDataFetch<KustomizationInfo>(
    () => fetchKustomizations(namespace),
    'Failed to fetch kustomizations',
    [namespace],
  );

  // Summary counts
  const readyCount = kustomizations.filter((k) => k.ready).length;
  const notReadyCount = kustomizations.filter((k) => !k.ready && !k.suspended).length;
  const suspendedCount = kustomizations.filter((k) => k.suspended).length;

  // Status determination for each card
  const getStatus = (k: KustomizationInfo): string => {
    if (k.suspended) return 'Suspended';
    return k.ready ? 'Ready' : 'NotReady';
  };

  return (
    <div data-testid="flux-page" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">FluxCD Kustomizations</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="Ready"
          value={String(readyCount)}
          testId="summary-card-ready"
        />
        <SummaryCard
          label="Not Ready"
          value={String(notReadyCount)}
          testId="summary-card-not-ready"
        />
        <SummaryCard
          label="Suspended"
          value={String(suspendedCount)}
          testId="summary-card-suspended"
        />
      </div>

      {/* Loading State */}
      {isLoading && kustomizations.length === 0 && (
        <LoadingSkeleton variant="card" count={3} />
      )}

      {/* Error State */}
      {error && kustomizations.length === 0 && (
        <ErrorRetry
          error={error}
          onRetry={refresh}
          title="Error loading kustomizations"
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && kustomizations.length === 0 && (
        <EmptyState message="No kustomizations found" />
      )}

      {/* Kustomization Cards */}
      {kustomizations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kustomizations.map((k) => (
            <div
              key={`${k.namespace}-${k.name}`}
              data-testid="kustomization-card"
              className="bg-white rounded-lg shadow p-6 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div data-testid="kustomization-name" className="text-lg font-semibold text-gray-900">
                  {k.name}
                </div>
                <StatusBadge status={getStatus(k)} />
              </div>
              <div data-testid="kustomization-namespace" className="text-sm text-gray-500">
                {k.namespace}
              </div>
              <div data-testid="kustomization-source" className="text-sm text-gray-600">
                {k.sourceKind}/{k.sourceName}
              </div>
              <div data-testid="kustomization-revision" className="text-sm text-gray-600 font-mono">
                {k.revision}
              </div>
              <div data-testid="kustomization-interval" className="text-sm text-gray-600">
                {k.interval}
              </div>
              <div data-testid="kustomization-last-applied" className="text-sm text-gray-600">
                {k.lastApplied}
              </div>
              <div className="text-sm text-gray-600">
                {k.path}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
