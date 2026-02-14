export interface ErrorRetryProps {
  error: string | Error;
  onRetry: () => void;
  title?: string;
  showIcon?: boolean;
  className?: string;
  testId?: string;
}

export function ErrorRetry({
  error,
  onRetry,
  title,
  showIcon = true,
  className = '',
  testId = 'error-retry',
}: ErrorRetryProps) {
  // Extract error message
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div
      data-testid={testId}
      role="alert"
      aria-live="polite"
      className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}
    >
      <div className="flex flex-col gap-4">
        {/* Icon and Title */}
        <div className="flex items-center gap-2">
          {showIcon && (
            <svg
              data-testid="error-icon"
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {title && <div className="text-red-800 font-medium">{title}</div>}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="text-red-600">{errorMessage}</div>
        )}

        {/* Retry Button */}
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors w-fit"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
