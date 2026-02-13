interface ErrorRetryProps {
  message: string;
  onRetry: () => void;
  buttonText?: string;
}

export function ErrorRetry({ message, onRetry, buttonText = 'Try Again' }: ErrorRetryProps) {
  return (
    <div
      data-testid="error-retry"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="flex flex-col items-center justify-center gap-4 p-6 bg-red-50 border border-red-200 rounded-lg"
    >
      {/* Error Icon */}
      <div
        data-testid="error-icon"
        aria-hidden="true"
        className="text-4xl text-red-600"
      >
        ⚠️
      </div>

      {/* Error Message */}
      <div className="text-center">
        <p className="text-red-700 font-medium">{message}</p>
      </div>

      {/* Retry Button */}
      <button
        onClick={onRetry}
        aria-label={`Retry - ${buttonText}`}
        className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
      >
        {buttonText}
      </button>
    </div>
  );
}
