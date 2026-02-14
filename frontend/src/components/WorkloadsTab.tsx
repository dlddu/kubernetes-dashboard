import { useState, useEffect } from 'react';
import { fetchDeployments, restartDeployment, DeploymentInfo } from '../api/deployments';
import { DeploymentCard } from './DeploymentCard';
import { RestartConfirmDialog } from './RestartConfirmDialog';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorRetry } from './ErrorRetry';
import { EmptyState } from './EmptyState';

interface WorkloadsTabProps {
  namespace?: string;
}

export function WorkloadsTab({ namespace }: WorkloadsTabProps) {
  const [deployments, setDeployments] = useState<DeploymentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restartingDeployment, setRestartingDeployment] = useState<{
    name: string;
    namespace: string;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartError, setRestartError] = useState<string | null>(null);

  const loadDeployments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchDeployments(namespace);
      setDeployments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deployments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeployments();
  }, [namespace]);

  const handleRestartClick = (deployment: { name: string; namespace: string }) => {
    setRestartingDeployment(deployment);
    setShowConfirmDialog(true);
    setRestartError(null);
  };

  const handleConfirmRestart = async () => {
    if (!restartingDeployment) return;

    try {
      setIsRestarting(true);
      setRestartError(null);
      await restartDeployment(restartingDeployment.namespace, restartingDeployment.name);
      // Success - close dialog and reload deployments
      setShowConfirmDialog(false);
      setRestartingDeployment(null);
      await loadDeployments();
    } catch (err) {
      setRestartError(err instanceof Error ? err.message : 'Failed to restart deployment');
    } finally {
      setIsRestarting(false);
    }
  };

  const handleCancelRestart = () => {
    if (!isRestarting) {
      setShowConfirmDialog(false);
      setRestartingDeployment(null);
      setRestartError(null);
    }
  };

  const handleRetry = () => {
    loadDeployments();
  };

  return (
    <div data-testid="workloads-page" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Workloads</h1>

      {isLoading && (
        <LoadingSkeleton
          variant="card"
          count={3}
          testId="loading-indicator"
        />
      )}

      {error && (
        <ErrorRetry
          error={error}
          onRetry={handleRetry}
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

      {!isLoading && !error && deployments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deployments.map((deployment) => (
            <DeploymentCard
              key={`${deployment.namespace}-${deployment.name}`}
              {...deployment}
              onRestart={handleRestartClick}
              isRestarting={
                isRestarting &&
                restartingDeployment?.name === deployment.name &&
                restartingDeployment?.namespace === deployment.namespace
              }
            />
          ))}
        </div>
      )}

      {restartingDeployment && (
        <RestartConfirmDialog
          isOpen={showConfirmDialog}
          deploymentName={restartingDeployment.name}
          deploymentNamespace={restartingDeployment.namespace}
          onConfirm={handleConfirmRestart}
          onCancel={handleCancelRestart}
          isRestarting={isRestarting}
          error={restartError || undefined}
        />
      )}
    </div>
  );
}
