import { useEffect, useState } from 'react';

interface PollingIndicatorProps {
  lastUpdated: Date | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  nextPollIn?: number;
}

export function PollingIndicator({
  lastUpdated,
  isLoading = false,
  onRefresh,
  nextPollIn
}: PollingIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!lastUpdated) {
      setTimeAgo('never updated');
      return;
    }

    const updateTimeAgo = () => {
      const now = Date.now();
      const updatedTime = lastUpdated.getTime();
      const diffMs = Math.max(0, now - updatedTime);
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);

      if (diffSeconds < 5) {
        setTimeAgo('just now');
      } else if (diffSeconds < 60) {
        setTimeAgo(`${diffSeconds} seconds ago`);
      } else if (diffMinutes < 60) {
        setTimeAgo(`${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`);
      } else if (diffHours < 24) {
        setTimeAgo(`${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`);
      } else {
        // Format as date
        const formattedDate = lastUpdated.toLocaleDateString();
        setTimeAgo(formattedDate);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  const getStatusIndicatorClass = () => {
    if (isLoading) {
      return 'bg-blue-500 animate-pulse';
    }

    if (!lastUpdated) {
      return 'bg-gray-400';
    }

    const now = Date.now();
    const updatedTime = lastUpdated.getTime();
    const diffMs = now - updatedTime;
    const diffMinutes = diffMs / 1000 / 60;

    if (diffMinutes > 2) {
      return 'bg-yellow-500';
    }

    return 'bg-green-500';
  };

  return (
    <div
      className="flex items-center gap-3 text-sm text-gray-600"
      data-testid="polling-indicator"
      aria-label="Last updated time and polling status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${getStatusIndicatorClass()}`}
          data-testid="polling-status-indicator"
        />
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"
              data-testid="loading-spinner"
            />
            <span>Updating...</span>
          </div>
        ) : (
          <span>Updated {timeAgo}</span>
        )}
      </div>

      {!isLoading && nextPollIn !== undefined && nextPollIn > 0 && (
        <span className="text-gray-500">Next update in {nextPollIn}s</span>
      )}

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          aria-label="Refresh data now"
        >
          {isLoading && (
            <div
              className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"
              data-testid="loading-spinner"
            />
          )}
          <svg
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      )}
    </div>
  );
}
