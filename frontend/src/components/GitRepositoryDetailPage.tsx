import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchGitRepositoryDetail, reconcileGitRepository, fetchGitRepositoryBranches, updateGitRepositoryBranch, GitRepositoryDetailInfo } from '../api/fluxcd';
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
  const [isEditingBranch, setIsEditingBranch] = useState(false);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);
  const [isUpdatingBranch, setIsUpdatingBranch] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
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

  const handleEditBranch = async () => {
    if (!namespace || !name) return;
    setIsEditingBranch(true);
    setBranchError(null);
    setIsFetchingBranches(true);
    setSelectedBranch(detail?.spec.ref.branch || '');
    try {
      const branchList = await fetchGitRepositoryBranches(namespace, name);
      setBranches(branchList);
    } catch (err) {
      setBranchError(err instanceof Error ? err.message : 'Failed to fetch branches');
    } finally {
      setIsFetchingBranches(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingBranch(false);
    setBranchError(null);
  };

  const handleSaveBranch = async () => {
    if (!namespace || !name || !selectedBranch) return;
    setIsUpdatingBranch(true);
    setBranchError(null);
    try {
      await updateGitRepositoryBranch(namespace, name, selectedBranch);
      setIsEditingBranch(false);
      await load();
    } catch (err) {
      setBranchError(err instanceof Error ? err.message : 'Failed to update branch');
    } finally {
      setIsUpdatingBranch(false);
    }
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
                {!isEditingBranch ? (
                  <span className="inline-flex items-center gap-2">
                    <span data-testid="gitrepository-detail-spec-ref">
                      {getRefDisplay()}
                    </span>
                    <button
                      data-testid="edit-branch-button"
                      onClick={handleEditBranch}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Edit
                    </button>
                  </span>
                ) : (
                  <div className="inline-flex flex-col gap-2 mt-1">
                    <div className="flex items-center gap-2">
                      {isFetchingBranches ? (
                        <span className="text-sm text-gray-500">Loading branches...</span>
                      ) : (
                        <select
                          data-testid="branch-select"
                          value={selectedBranch}
                          onChange={(e) => setSelectedBranch(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isUpdatingBranch}
                        >
                          {!selectedBranch && (
                            <option value="" disabled>
                              Select a branch
                            </option>
                          )}
                          {selectedBranch && !branches.includes(selectedBranch) && (
                            <option value={selectedBranch}>{selectedBranch}</option>
                          )}
                          {branches.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      )}
                      <button
                        data-testid="save-branch-button"
                        onClick={handleSaveBranch}
                        disabled={isUpdatingBranch || isFetchingBranches || !selectedBranch}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                      >
                        {isUpdatingBranch ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        data-testid="cancel-branch-button"
                        onClick={handleCancelEdit}
                        disabled={isUpdatingBranch}
                        className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded text-sm border border-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                    {branchError && (
                      <span data-testid="branch-error" className="text-red-600 text-xs">
                        {branchError}
                      </span>
                    )}
                  </div>
                )}
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
