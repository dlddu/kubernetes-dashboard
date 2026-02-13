interface ErrorRetryProps {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
  details?: string;
}

export function ErrorRetry({
  message = 'Something went wrong',
  onRetry,
  isRetrying = false,
  className = '',
  details,
}: ErrorRetryProps) {
  return (
    <div
      data-testid="error-retry"
      role="alert"
      aria-live="assertive"
      className={`flex flex-col items-center justify-center text-center space-y-4 p-6 ${className}`}
    >
      <div data-testid="error-icon" className="text-red-500">
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <div>
        <div data-testid="error-message" className="text-lg font-medium text-gray-900 mb-2">
          {message}
        </div>
        {details && (
          <div data-testid="error-details" className="text-sm text-gray-600">
            {details}
          </div>
        )}
      </div>

      <button
        onClick={onRetry}
        disabled={isRetrying}
        aria-busy={isRetrying ? 'true' : 'false'}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRetrying ? (
          <>
            <span data-testid="retry-loading" className="inline-block mr-2">
              <svg className="animate-spin h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </span>
            Retrying...
          </>
        ) : (
          'Retry'
        )}
      </button>
    </div>
  );
}
