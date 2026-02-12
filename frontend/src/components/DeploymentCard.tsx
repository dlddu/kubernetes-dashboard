import { DeploymentInfo } from '../api/deployments';

interface DeploymentCardProps extends DeploymentInfo {
  onRestart?: (deployment: { name: string; namespace: string }) => void;
  isRestarting?: boolean;
}

export function DeploymentCard({
  name,
  namespace,
  replicas,
  readyReplicas,
  availableReplicas: _availableReplicas,
  onRestart,
  isRestarting = false,
}: DeploymentCardProps) {
  const handleRestartClick = () => {
    if (onRestart) {
      onRestart({ name, namespace });
    }
  };

  // Determine status color based on ready replicas
  const getStatusClass = (): string => {
    if (readyReplicas === 0 && replicas > 0) {
      return 'text-red-600'; // Critical - no replicas ready
    } else if (readyReplicas < replicas) {
      return 'text-yellow-600'; // Warning - partial readiness
    } else {
      return 'text-green-600'; // Success - all ready
    }
  };

  return (
    <div data-testid="deployment-card" className="bg-white rounded-lg shadow p-6 space-y-4">
      {/* Deployment Name */}
      <div className="flex items-center justify-between">
        <h3 data-testid="deployment-name" className="text-lg font-semibold text-gray-900 truncate">
          {name}
        </h3>
      </div>

      {/* Namespace */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">Namespace: </span>
        <span data-testid="deployment-namespace">{namespace}</span>
      </div>

      {/* Ready Replicas */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Replicas</div>
        <div data-testid="deployment-ready" className={`text-2xl font-bold ${getStatusClass()}`}>
          {readyReplicas}/{replicas}
        </div>
      </div>

      {/* Restart Button */}
      <button
        data-testid="restart-button"
        role="button"
        aria-label={`Restart deployment ${name}`}
        aria-busy={isRestarting}
        onClick={handleRestartClick}
        disabled={isRestarting}
        className={`w-full px-4 py-2 rounded transition-colors ${
          isRestarting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isRestarting ? 'Restarting...' : 'Restart'}
      </button>
    </div>
  );
}
