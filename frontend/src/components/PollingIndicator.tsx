import { useEffect, useState } from 'react';

interface PollingIndicatorProps {
  lastUpdated?: Date | null;
  loading?: boolean;
  onRefresh?: () => void;
  nextRefreshIn?: number;
  paused?: boolean;
}

export function PollingIndicator({
  lastUpdated,
  loading = false,
  onRefresh,
  nextRefreshIn,
  paused = false,
}: PollingIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!lastUpdated) {
      setTimeAgo('never updated');
      return;
    }

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = Math.max(0, now.getTime() - lastUpdated.getTime());
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 5) {
        setTimeAgo('just now');
      } else if (seconds < 60) {
        setTimeAgo(`${seconds} second${seconds !== 1 ? 's' : ''} ago`);
      } else if (minutes < 60) {
        setTimeAgo(`${minutes} minute${minutes !== 1 ? 's' : ''} ago`);
      } else if (hours < 24) {
        setTimeAgo(`${hours} hour${hours !== 1 ? 's' : ''} ago`);
      } else {
        setTimeAgo(`${days} day${days !== 1 ? 's' : ''} ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div
      data-testid="polling-indicator"
      aria-label="Polling indicator"
      aria-live="polite"
      aria-busy={loading}
      className="flex items-center gap-3 text-sm text-gray-600"
    >
      {loading ? (
        <>
          <div
            data-testid="loading-spinner"
            className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
          />
          <span>Updating...</span>
        </>
      ) : paused ? (
        <span>Paused (will resume when tab is visible)</span>
      ) : (
        <>
          <span>Updated {timeAgo}</span>
          {nextRefreshIn && nextRefreshIn > 0 && (
            <span className="text-gray-500">Next refresh in {nextRefreshIn}s</span>
          )}
        </>
      )}
      <button
        onClick={onRefresh}
        disabled={loading}
        aria-label="Refresh data"
        className="ml-2 p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className="w-4 h-4"
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
      </button>
    </div>
  );
}
