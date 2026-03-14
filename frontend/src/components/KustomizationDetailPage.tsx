import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchKustomizationDetail, reconcileKustomization, KustomizationDetailInfo } from '../api/fluxcd';
import { usePolling } from '../hooks/usePolling';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorRetry } from './ErrorRetry';

function getConditionBorderClass(status: string): string {
  switch (status) {
    case 'True':
      return 'border-l-4 border-l-green-500';
    case 'False':
      return 'border-l-4 border-l-red-500';
    default:
      return 'border-l-4 border-l-gray-400';
  }
}

function formatTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleString();
  } catch {
    return isoString;
  }
}

export function KustomizationDetailPage() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<KustomizationDetailInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!namespace || !name) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchKustomizationDetail(namespace, name);
      setDetail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load kustomization detail');
    } finally {
      setIsLoading(false);
    }
  }, [namespace, name]);

  usePolling(load);

  useEffect(() => {
    load();
  }, [load]);

  const handleRetry = () => {
    load();
  };

  const handleReconcile = async () => {
    if (!namespace || !name) return;
    setIsReconciling(true);
    setReconcileError(null);
    try {
      await reconcileKustomization(namespace, name);
      await load(); // re-fetch after reconcile
    } catch (err) {
      setReconcileError(err instanceof Error ? err.message : 'Failed to reconcile');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleBack = () => {
    navigate('/flux');
  };

  return (
    <div data-testid="kustomization-detail-page" className="space-y-4">
      {/* Back button — always visible */}
      <button
        data-testid="kustomization-detail-back-button"
        onClick={handleBack}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        &larr; Back to FluxCD
      </button>

      {/* Loading state */}
      {isLoading && (
        <LoadingSkeleton variant="card" count={3} />
      )}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorRetry
          error={error}
          onRetry={handleRetry}
          title="Error loading kustomization detail"
        />
      )}

      {/* Detail content */}
      {!isLoading && !error && detail && (
        <>
          {/* Spec Card */}
          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <h2 className="text-xl font-bold text-gray-900">{detail.name}</h2>
            <p className="text-sm text-gray-500">{detail.namespace}</p>

            <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
              <div>
                <span className="font-medium">Source: </span>
                <span data-testid="kustomization-detail-spec-source">
                  {detail.spec.sourceRef.kind}/{detail.spec.sourceRef.name}
                  {detail.spec.sourceRef.namespace ? `/${detail.spec.sourceRef.namespace}` : ''}
                </span>
              </div>

              <div>
                <span className="font-medium">Path: </span>
                <span data-testid="kustomization-detail-spec-path" className="font-mono">
                  {detail.spec.path}
                </span>
              </div>

              <div>
                <span className="font-medium">Interval: </span>
                <span data-testid="kustomization-detail-spec-interval">
                  {detail.spec.interval}
                </span>
              </div>

              <div>
                <span className="font-medium">Prune: </span>
                <span data-testid="kustomization-detail-spec-prune">
                  {String(detail.spec.prune)}
                </span>
              </div>

              <div>
                <span className="font-medium">Suspended: </span>
                <span data-testid="kustomization-detail-spec-suspended">
                  {String(detail.suspended)}
                </span>
              </div>

              <div data-testid="kustomization-detail-spec-depends-on">
                <span className="font-medium">Depends On: </span>
                {detail.spec.dependsOn.length === 0 ? (
                  <span className="text-gray-400">None</span>
                ) : (
                  <ul className="mt-1 list-disc list-inside">
                    {detail.spec.dependsOn.map((dep) => (
                      <li key={`${dep.namespace || '_'}/${dep.name}`} className="text-gray-700">
                        {dep.namespace ? `${dep.namespace}/` : ''}{dep.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Status</h3>

            <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
              <div>
                <span className="font-medium">Revision: </span>
                <span
                  data-testid="kustomization-detail-status-revision"
                  className="font-mono text-gray-800"
                >
                  {detail.status.lastAppliedRevision}
                </span>
              </div>

              <div data-testid="kustomization-detail-status-last-applied">
                <span className="font-medium">Last Condition Transition: </span>
                {detail.status.conditions.length > 0
                  ? formatTime(detail.status.conditions[0].lastTransitionTime)
                  : '-'}
              </div>
            </div>
          </div>

          {/* Conditions Card */}
          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Conditions</h3>

            <div data-testid="kustomization-detail-conditions" className="space-y-2">
              {detail.status.conditions.map((condition) => (
                <div
                  key={condition.type}
                  data-testid="kustomization-detail-condition"
                  className={`pl-4 py-3 bg-gray-50 rounded-r ${getConditionBorderClass(condition.status)}`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      condition.status === 'True'
                        ? 'bg-green-500'
                        : condition.status === 'False'
                        ? 'bg-red-500'
                        : 'bg-gray-400'
                    }`}
                  />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Type: </span>
                      <span data-testid="kustomization-detail-condition-type" className="text-gray-900">
                        {condition.type}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Status: </span>
                      <span data-testid="kustomization-detail-condition-status" className="text-gray-900">
                        {condition.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Reason: </span>
                      <span data-testid="kustomization-detail-condition-reason" className="text-gray-900">
                        {condition.reason}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">Message: </span>
                      <span data-testid="kustomization-detail-condition-message" className="text-gray-700">
                        {condition.message}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reconcile Button */}
          <button
            data-testid="reconcile-button"
            onClick={handleReconcile}
            disabled={isReconciling}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isReconciling && (
              <svg
                data-testid="reconcile-spinner"
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isReconciling ? 'Reconciling...' : 'Reconcile Now'}
          </button>

          {/* Reconcile Error */}
          {reconcileError && (
            <div
              data-testid="reconcile-error"
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
            >
              {reconcileError}
            </div>
          )}
        </>
      )}
    </div>
  );
}
