import { useNavigate } from 'react-router-dom';
import { fetchKustomizations, KustomizationInfo, fetchGitRepositories, GitRepositoryInfo } from '../api/fluxcd';
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
  const navigate = useNavigate();
  const { data: kustomizations, isLoading: isLoadingKustomizations, error: kustomizationsError, refresh: refreshKustomizations } = useDataFetch<KustomizationInfo>(
    () => fetchKustomizations(namespace),
    'Failed to fetch kustomizations',
    [namespace],
  );

  const { data: gitRepositories, isLoading: isLoadingGitRepos, error: gitReposError, refresh: refreshGitRepos } = useDataFetch<GitRepositoryInfo>(
    () => fetchGitRepositories(namespace),
    'Failed to fetch git repositories',
    [namespace],
  );

  const isLoading = isLoadingKustomizations || isLoadingGitRepos;

  // Kustomization summary counts
  const kustomizationReadyCount = kustomizations.filter((k) => k.ready && !k.suspended).length;
  const kustomizationNotReadyCount = kustomizations.filter((k) => !k.ready && !k.suspended).length;
  const kustomizationSuspendedCount = kustomizations.filter((k) => k.suspended).length;

  // GitRepository summary counts
  const gitRepoReadyCount = gitRepositories.filter((g) => g.ready && !g.suspended).length;
  const gitRepoNotReadyCount = gitRepositories.filter((g) => !g.ready && !g.suspended).length;
  const gitRepoSuspendedCount = gitRepositories.filter((g) => g.suspended).length;

  // Status determination for each card
  const getStatus = (item: { ready: boolean; suspended: boolean }): string => {
    if (item.suspended) return 'Suspended';
    return item.ready ? 'Ready' : 'NotReady';
  };

  return (
    <div data-testid="flux-page" className="space-y-6">
      {/* GitRepositories Section */}
      <h1 className="text-2xl font-bold text-gray-900">FluxCD GitRepositories</h1>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="Ready"
          value={String(gitRepoReadyCount)}
          testId="summary-card-gitrepo-ready"
        />
        <SummaryCard
          label="Not Ready"
          value={String(gitRepoNotReadyCount)}
          testId="summary-card-gitrepo-not-ready"
        />
        <SummaryCard
          label="Suspended"
          value={String(gitRepoSuspendedCount)}
          testId="summary-card-gitrepo-suspended"
        />
      </div>

      {isLoadingGitRepos && gitRepositories.length === 0 && (
        <LoadingSkeleton variant="card" count={3} />
      )}

      {gitReposError && gitRepositories.length === 0 && (
        <ErrorRetry
          error={gitReposError}
          onRetry={refreshGitRepos}
          title="Error loading git repositories"
        />
      )}

      {!isLoadingGitRepos && !gitReposError && gitRepositories.length === 0 && (
        <EmptyState message="No git repositories found" />
      )}

      {gitRepositories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gitRepositories.map((gr) => (
            <div
              key={`${gr.namespace}-${gr.name}`}
              data-testid="gitrepository-card"
              className="bg-white rounded-lg shadow p-6 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/fluxcd/gitrepository/${gr.namespace}/${gr.name}`)}
            >
              <div className="flex items-center justify-between">
                <div data-testid="gitrepository-name" className="text-lg font-semibold text-gray-900">
                  {gr.name}
                </div>
                <StatusBadge status={getStatus(gr)} />
              </div>
              <div data-testid="gitrepository-namespace" className="text-sm text-gray-500">
                {gr.namespace}
              </div>
              <div data-testid="gitrepository-url" className="text-sm text-gray-600 font-mono truncate" title={gr.url}>
                {gr.url}
              </div>
              {(gr.branch || gr.tag) && (
                <div data-testid="gitrepository-ref" className="text-sm text-gray-600">
                  {gr.branch ? `branch: ${gr.branch}` : `tag: ${gr.tag}`}
                </div>
              )}
              {gr.revision && (
                <div data-testid="gitrepository-revision" className="text-sm text-gray-600 font-mono truncate" title={gr.revision}>
                  {gr.revision}
                </div>
              )}
              <div data-testid="gitrepository-interval" className="text-sm text-gray-600">
                {gr.interval}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kustomizations Section */}
      <h1 className="text-2xl font-bold text-gray-900">FluxCD Kustomizations</h1>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="Ready"
          value={String(kustomizationReadyCount)}
          testId="summary-card-ready"
        />
        <SummaryCard
          label="Not Ready"
          value={String(kustomizationNotReadyCount)}
          testId="summary-card-not-ready"
        />
        <SummaryCard
          label="Suspended"
          value={String(kustomizationSuspendedCount)}
          testId="summary-card-suspended"
        />
      </div>

      {isLoadingKustomizations && kustomizations.length === 0 && (
        <LoadingSkeleton variant="card" count={3} />
      )}

      {kustomizationsError && kustomizations.length === 0 && (
        <ErrorRetry
          error={kustomizationsError}
          onRetry={refreshKustomizations}
          title="Error loading kustomizations"
        />
      )}

      {!isLoadingKustomizations && !kustomizationsError && kustomizations.length === 0 && (
        <EmptyState message="No kustomizations found" />
      )}

      {kustomizations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kustomizations.map((k) => (
            <div
              key={`${k.namespace}-${k.name}`}
              data-testid="kustomization-card"
              className="bg-white rounded-lg shadow p-6 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/fluxcd/${k.namespace}/${k.name}`)}
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
              {k.revision && (
                <div data-testid="kustomization-revision" className="text-sm text-gray-600 font-mono">
                  {k.revision}
                </div>
              )}
              <div data-testid="kustomization-interval" className="text-sm text-gray-600">
                {k.interval}
              </div>
              {k.lastApplied && (
                <div data-testid="kustomization-last-applied" className="text-sm text-gray-600">
                  {k.lastApplied}
                </div>
              )}
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
