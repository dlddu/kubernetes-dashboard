import { useEffect, useState } from 'react';

interface PollingIndicatorProps {
  lastUpdated: Date | null | undefined;
  isLoading?: boolean;
}

export function PollingIndicator({ lastUpdated, isLoading = false }: PollingIndicatorProps) {
  const [, setTick] = useState(0);

  // Update every second to refresh the relative time
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getRelativeTime = (date: Date | null | undefined): string => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Never updated';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Handle future dates
    if (diffMs < 0) {
      return 'Just now';
    }

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 5) {
      return 'Just now';
    } else if (diffSeconds < 60) {
      return `${diffSeconds} ${diffSeconds === 1 ? 'second' : 'seconds'} ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      // For dates older than a day, show the actual date
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      };
      return date.toLocaleDateString('en-US', options);
    }
  };

  const relativeTime = getRelativeTime(lastUpdated);

  return (
    <div
      data-testid="polling-indicator"
      className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap"
      aria-label={`Last updated ${relativeTime}`}
      aria-live="polite"
    >
      {isLoading ? (
        <>
          <svg
            data-testid="loading-spinner"
            className="animate-spin h-4 w-4 text-blue-500"
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
          <span>Updating...</span>
        </>
      ) : (
        <>
          <svg
            data-testid="clock-icon"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Last updated:</span>
          <time
            role="time"
            dateTime={lastUpdated && !isNaN(lastUpdated.getTime()) ? lastUpdated.toISOString() : undefined}
          >
            {relativeTime}
          </time>
        </>
      )}
    </div>
  );
}
