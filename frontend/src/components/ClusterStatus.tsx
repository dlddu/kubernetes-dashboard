import { FC } from 'react';

interface ClusterStatusProps {
  clusterName?: string;
  status?: 'connected' | 'disconnected' | 'loading' | 'error' | 'degraded';
  errorMessage?: string;
  version?: string;
  compact?: boolean;
  onRefresh?: () => void;
}

const ClusterStatus: FC<ClusterStatusProps> = ({
  clusterName = 'local-cluster',
  status = 'connected',
  errorMessage,
  version,
  compact,
  onRefresh,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'disconnected':
      case 'error':
        return 'bg-red-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'loading':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'loading':
        return 'Loading';
      case 'error':
        return 'Error';
      case 'degraded':
        return 'Degraded';
      default:
        return 'Unknown';
    }
  };

  const displayName = clusterName || 'local-cluster';
  const tooltipText = errorMessage || `${displayName} - ${getStatusText()}`;

  return (
    <div
      data-testid="cluster-status"
      data-compact={compact}
      role="status"
      aria-label={`Cluster status: ${getStatusText()}`}
      aria-live="polite"
      title={tooltipText}
      onClick={onRefresh}
      className={`flex items-center gap-2 ${onRefresh ? 'cursor-pointer' : ''}`}
    >
      {status === 'loading' ? (
        <div
          data-testid="cluster-status-loading"
          data-loading="true"
          className="flex items-center gap-2"
        >
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      ) : (
        <>
          <div
            data-testid="cluster-status-indicator"
            data-status={status}
            className={`w-2 h-2 rounded-full ${getStatusColor()}`}
          />
          <div className="flex flex-col">
            <span
              data-testid="cluster-name"
              className="text-sm font-medium text-gray-900 truncate"
            >
              {displayName}
            </span>
            {version && (
              <span className="text-xs text-gray-500">{version}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClusterStatus;
