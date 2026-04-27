import { fetchExternalSecrets, ExternalSecretInfo } from '../api/externalSecrets';
import { useDataFetch } from '../hooks/useDataFetch';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { ErrorRetry } from './ErrorRetry';
import { SummaryCard } from './SummaryCard';
import { StatusBadge } from './StatusBadge';

interface ExternalSecretsTabProps {
  namespace?: string;
}

export function ExternalSecretsTab({ namespace }: ExternalSecretsTabProps) {
  const { data: externalSecrets, isLoading, error, refresh } = useDataFetch<ExternalSecretInfo>(
    () => fetchExternalSecrets(namespace),
    'Failed to fetch external secrets',
    [namespace],
  );

  const readyCount = externalSecrets.filter((es) => es.ready).length;
  const notReadyCount = externalSecrets.filter((es) => !es.ready).length;

  return (
    <div data-testid="external-secrets-tab" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">External Secrets</h1>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="Total"
          value={String(externalSecrets.length)}
          testId="summary-card-external-secrets-total"
        />
        <SummaryCard
          label="Ready"
          value={String(readyCount)}
          testId="summary-card-external-secrets-ready"
        />
        <SummaryCard
          label="Not Ready"
          value={String(notReadyCount)}
          testId="summary-card-external-secrets-not-ready"
        />
      </div>

      {isLoading && externalSecrets.length === 0 && (
        <LoadingSkeleton variant="card" count={3} testId="external-secrets-loading" />
      )}

      {error && externalSecrets.length === 0 && (
        <ErrorRetry
          error={error}
          onRetry={refresh}
          title="Error loading external secrets"
          testId="external-secrets-error"
        />
      )}

      {!isLoading && !error && externalSecrets.length === 0 && (
        <EmptyState
          message={`No external secrets found${namespace ? ` in namespace "${namespace}"` : ''}`}
          testId="no-external-secrets-message"
        />
      )}

      {externalSecrets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {externalSecrets.map((es) => (
            <div
              key={`${es.namespace}-${es.name}`}
              data-testid="external-secret-card"
              className="bg-white rounded-lg shadow p-6 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div data-testid="external-secret-name" className="text-lg font-semibold text-gray-900 truncate" title={es.name}>
                  {es.name}
                </div>
                <StatusBadge status={es.status || 'Unknown'} />
              </div>
              <div data-testid="external-secret-namespace" className="text-sm text-gray-500">
                {es.namespace}
              </div>
              {(es.storeKind || es.storeName) && (
                <div data-testid="external-secret-store" className="text-sm text-gray-600">
                  store: {es.storeKind}/{es.storeName || '-'}
                </div>
              )}
              {es.targetName && (
                <div data-testid="external-secret-target" className="text-sm text-gray-600">
                  target: {es.targetName}
                </div>
              )}
              {es.refreshInterval && (
                <div data-testid="external-secret-refresh" className="text-sm text-gray-600">
                  refresh: {es.refreshInterval}
                </div>
              )}
              {es.lastSyncTime && (
                <div data-testid="external-secret-last-sync" className="text-sm text-gray-600">
                  last sync: {es.lastSyncTime}
                </div>
              )}
              {!es.ready && es.reason && (
                <div data-testid="external-secret-reason" className="text-sm text-red-700">
                  {es.reason}
                  {es.message ? `: ${es.message}` : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
