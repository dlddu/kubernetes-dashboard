interface ErrorRetryProps {
  message: string;
  onRetry: () => void;
  title?: string;
  retryButtonText?: string;
  className?: string;
}

export function ErrorRetry({
  message,
  onRetry,
  title,
  retryButtonText = 'Try Again',
  className = '',
}: ErrorRetryProps) {
  return (
    <div
      data-testid="error-retry"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`flex flex-col items-center justify-center text-center p-8 ${className}`}
    >
      {/* Error Icon */}
      <svg
        data-testid="error-icon"
        className="w-12 h-12 text-red-500 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      {/* Title */}
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>}

      {/* Error Message */}
      <p className="text-red-600 mb-6 max-w-md">{message}</p>

      {/* Retry Button */}
      <button
        onClick={onRetry}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onRetry();
          }
        }}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        aria-label={retryButtonText}
      >
        {retryButtonText}
      </button>
    </div>
  );
}
