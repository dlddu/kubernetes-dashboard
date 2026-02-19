import { useCallback } from 'react';
import { fetchDeployments, restartDeployment, DeploymentInfo } from '../api/deployments';
import { DeploymentCard } from './DeploymentCard';
import { RestartConfirmDialog } from './RestartConfirmDialog';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorRetry } from './ErrorRetry';
import { EmptyState } from './EmptyState';
import { useDataFetch } from '../hooks/useDataFetch';
import { useConfirmAction } from '../hooks/useConfirmAction';

interface WorkloadsTabProps {
  namespace?: string;
}

export function WorkloadsTab({ namespace }: WorkloadsTabProps) {
  const { data: deployments, isLoading, error, refresh } = useDataFetch<DeploymentInfo>(
    () => fetchDeployments(namespace),
    'Failed to fetch deployments',
    [namespace],
  );

  const restartAction = useConfirmAction(
    useCallback(
      (target: { name: string; namespace: string }) =>
        restartDeployment(target.namespace, target.name),
      [],
    ),
    refresh,
    'Failed to restart deployment',
  );

  return (
    <div data-testid="workloads-page" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Workloads</h1>

      {isLoading && deployments.length === 0 && (
        <LoadingSkeleton
          variant="card"
          count={3}
          testId="loading-indicator"
        />
      )}

      {error && deployments.length === 0 && (
        <ErrorRetry
          error={error}
          onRetry={refresh}
          title="Error loading deployments"
          testId="error-message"
        />
      )}

      {!isLoading && !error && deployments.length === 0 && (
        <EmptyState
          message="No deployments found"
          testId="empty-state"
        />
      )}

      {deployments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deployments.map((deployment) => (
            <DeploymentCard
              key={`${deployment.namespace}-${deployment.name}`}
              {...deployment}
              onRestart={restartAction.requestAction}
              isRestarting={
                restartAction.isProcessing &&
                restartAction.target?.name === deployment.name &&
                restartAction.target?.namespace === deployment.namespace
              }
            />
          ))}
        </div>
      )}

      {restartAction.target && (
        <RestartConfirmDialog
          isOpen={restartAction.showDialog}
          deploymentName={restartAction.target.name}
          deploymentNamespace={restartAction.target.namespace}
          onConfirm={restartAction.confirm}
          onCancel={restartAction.cancel}
          isRestarting={restartAction.isProcessing}
          error={restartAction.error || undefined}
        />
      )}
    </div>
  );
}
