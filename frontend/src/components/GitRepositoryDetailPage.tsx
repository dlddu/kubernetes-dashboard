import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchGitRepositoryDetail, reconcileGitRepository, GitRepositoryDetailInfo } from '../api/fluxcd';
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

export function GitRepositoryDetailPage() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<GitRepositoryDetailInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    if (!namespace || !name) return;
    if (!hasLoadedRef.current) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const result = await fetchGitRepositoryDetail(namespace, name);
      setDetail(result);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load git repository detail');
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
      await reconcileGitRepository(namespace, name);
      await load();
    } catch (err) {
      setReconcileError(err instanceof Error ? err.message : 'Failed to reconcile');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleBack = () => {
    navigate('/flux');
  };

  const getRefDisplay = () => {
    if (!detail) return '-';
    const ref = detail.spec.ref;
    if (ref.branch) return `branch: ${ref.branch}`;
    if (ref.tag) return `tag: ${ref.tag}`;
    if (ref.semver) return `semver: ${ref.semver}`;
    if (ref.commit) return `commit: ${ref.commit}`;
    return '-';
  };

  return (
    <div data-testid="gitrepository-detail-page" className="space-y-4">
      <button
        data-testid="gitrepository-detail-back-button"
        onClick={handleBack}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        &larr; Back to FluxCD
      </button>

      {isLoading && (
        <LoadingSkeleton variant="card" count={3} />
      )}

      {!isLoading && error && (
        <ErrorRetry
          error={error}
          onRetry={handleRetry}
          title="Error loading git repository detail"
        />
      )}

      {!isLoading && !error && detail && (
        <>
          {/* Spec Card */}
          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <h2 className="text-xl font-bold text-gray-900">{detail.name}</h2>
            <p className="text-sm text-gray-500">{detail.namespace}</p>

            <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
              <div>
                <span className="font-medium">URL: </span>
                <span data-testid="gitrepository-detail-spec-url" className="font-mono">
                  {detail.spec.url}
                </span>
              </div>

              <div>
                <span className="font-medium">Ref: </span>
                <span data-testid="gitrepository-detail-spec-ref">
                  {getRefDisplay()}
                </span>
              </div>

              <div>
                <span className="font-medium">Interval: </span>
                <span data-testid="gitrepository-detail-spec-interval">
                  {detail.spec.interval}
                </span>
              </div>

              <div>
                <span className="font-medium">Suspended: </span>
                <span data-testid="gitrepository-detail-spec-suspended">
                  {String(detail.suspended)}
                </span>
              </div>

              {detail.spec.secretRef && (
                <div>
                  <span className="font-medium">Secret Ref: </span>
                  <span data-testid="gitrepository-detail-spec-secret-ref">
                    {detail.spec.secretRef.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Status</h3>

            <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
              <div>
                <span className="font-medium">Revision: </span>
                <span
                  data-testid="gitrepository-detail-status-revision"
                  className="font-mono text-gray-800"
                >
                  {detail.status.artifact?.revision || '-'}
                </span>
              </div>

              <div data-testid="gitrepository-detail-status-last-update">
                <span className="font-medium">Last Update: </span>
                {detail.status.artifact?.lastUpdateTime
                  ? formatTime(detail.status.artifact.lastUpdateTime)
                  : '-'}
              </div>
            </div>
          </div>

          {/* Conditions Card */}
          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Conditions</h3>

            <div data-testid="gitrepository-detail-conditions" className="space-y-2">
              {detail.status.conditions.map((condition) => (
                <div
                  key={condition.type}
                  data-testid="gitrepository-detail-condition"
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
                      <span data-testid="gitrepository-detail-condition-type" className="text-gray-900">
                        {condition.type}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Status: </span>
                      <span data-testid="gitrepository-detail-condition-status" className="text-gray-900">
                        {condition.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Reason: </span>
                      <span data-testid="gitrepository-detail-condition-reason" className="text-gray-900">
                        {condition.reason}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">Message: </span>
                      <span data-testid="gitrepository-detail-condition-message" className="text-gray-700">
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
