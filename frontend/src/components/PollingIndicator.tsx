import { useEffect, useState } from 'react';

export interface PollingIndicatorProps {
  lastUpdate?: Date;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function PollingIndicator({
  lastUpdate,
  onRefresh,
  isLoading = false,
}: PollingIndicatorProps) {
  const [relativeTime, setRelativeTime] = useState<string>('');

  // Calculate relative time from lastUpdate
  useEffect(() => {
    const updateRelativeTime = () => {
      if (!lastUpdate || isNaN(lastUpdate.getTime())) {
        setRelativeTime('just now');
        return;
      }

      const now = Date.now();
      const lastUpdateTime = lastUpdate.getTime();
      const secondsAgo = Math.floor((now - lastUpdateTime) / 1000);

      if (secondsAgo < 10) {
        setRelativeTime('just now');
      } else if (secondsAgo < 60) {
        const unit = secondsAgo === 1 ? 'second' : 'seconds';
        setRelativeTime(`${secondsAgo} ${unit} ago`);
      } else {
        const minutesAgo = Math.floor(secondsAgo / 60);
        const unit = minutesAgo === 1 ? 'minute' : 'minutes';
        setRelativeTime(`${minutesAgo} ${unit} ago`);
      }
    };

    // Update immediately
    updateRelativeTime();

    // Update every second
    const intervalId = setInterval(updateRelativeTime, 1000);

    return () => clearInterval(intervalId);
  }, [lastUpdate]);

  // Format full timestamp for tooltip
  const getFullTimestamp = (): string => {
    if (!lastUpdate || isNaN(lastUpdate.getTime())) {
      return '';
    }
    return lastUpdate.toLocaleString();
  };

  return (
    <div
      data-testid="polling-indicator"
      aria-label="Auto-refresh status"
      aria-live="polite"
      aria-busy={isLoading}
      className="flex items-center gap-3"
    >
      {/* Loading indicator */}
      {isLoading && (
        <div
          data-testid="syncing-indicator"
          role="status"
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          <svg
            className="animate-spin h-4 w-4 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Syncing...</span>
        </div>
      )}

      {/* Last update time */}
      <div
        data-testid="last-update-time"
        className="text-sm text-gray-600"
        title={getFullTimestamp()}
      >
        {relativeTime}
      </div>

      {/* Refresh button */}
      <button
        data-testid="refresh-button"
        onClick={onRefresh}
        disabled={isLoading}
        aria-label="Refresh dashboard data"
        className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg
          className="h-4 w-4 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  );
}
