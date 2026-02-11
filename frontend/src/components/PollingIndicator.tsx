import { useState, useEffect } from 'react';

interface PollingIndicatorProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isLoading?: boolean;
}

/**
 * Get relative time string from a date
 * @param date - Date to format
 * @returns Relative time string (e.g., "just now", "30 seconds ago")
 */
function getRelativeTimeString(date: Date | null): string {
  if (!date || isNaN(date.getTime())) {
    return 'Never';
  }

  const now = Date.now();
  const timestamp = date.getTime();
  const diffMs = now - timestamp;

  // Handle future dates
  if (diffMs < 0) {
    return 'just now';
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 5) {
    return 'just now';
  } else if (seconds < 60) {
    return `${seconds} ${seconds === 1 ? 'second' : 'seconds'} ago`;
  } else if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
}

/**
 * PollingIndicator component - Shows last update time and refresh button
 */
export function PollingIndicator({
  lastUpdated,
  onRefresh,
  isLoading = false,
}: PollingIndicatorProps) {
  const [relativeTime, setRelativeTime] = useState<string>(() =>
    getRelativeTimeString(lastUpdated)
  );

  // Update relative time every second
  useEffect(() => {
    setRelativeTime(getRelativeTimeString(lastUpdated));

    const timer = setInterval(() => {
      setRelativeTime(getRelativeTimeString(lastUpdated));
    }, 1000);

    return () => clearInterval(timer);
  }, [lastUpdated]);

  const handleRefresh = () => {
    if (!isLoading) {
      try {
        onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      }
    }
  };

  // Format full timestamp for tooltip
  const fullTimestamp = lastUpdated && !isNaN(lastUpdated.getTime())
    ? lastUpdated.toLocaleString()
    : undefined;

  return (
    <div
      data-testid="polling-indicator"
      className="flex items-center gap-3"
      aria-live="polite"
    >
      <span
        data-testid="last-update-time"
        className="text-sm text-gray-600"
        title={fullTimestamp}
      >
        Updated {relativeTime}
      </span>

      <button
        data-testid="refresh-button"
        type="button"
        onClick={handleRefresh}
        disabled={isLoading}
        aria-label="Refresh data"
        className={`
          p-2 rounded-lg transition-colors
          ${
            isLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
              : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
          }
        `}
      >
        {isLoading ? (
          <svg
            data-testid="loading-indicator"
            className="w-4 h-4 animate-spin"
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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
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
        )}
      </button>
    </div>
  );
}
