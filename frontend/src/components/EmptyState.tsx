import { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  icon?: ReactNode;
  description?: string;
  actionButtonText?: string;
  onAction?: () => void;
  className?: string;
  title?: string;
  illustration?: string;
  showIcon?: boolean;
}

export function EmptyState({
  message,
  icon,
  description,
  actionButtonText,
  onAction,
  className = '',
  title,
  illustration,
  showIcon = true,
}: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      role="status"
      aria-label="Empty state: No data available"
      className={`flex flex-col items-center justify-center text-center p-12 ${className}`}
    >
      {/* Icon or Illustration */}
      {showIcon && !illustration && (
        <div data-testid="empty-state-icon">
          {icon || (
            <svg
              className="w-16 h-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          )}
        </div>
      )}

      {illustration && (
        <img
          src={illustration}
          alt="Empty state illustration"
          role="img"
          className="w-32 h-32 mb-4"
        />
      )}

      {/* Title */}
      {title && <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>}

      {/* Message */}
      <p className="text-gray-600 text-lg mb-2">{message}</p>

      {/* Description */}
      {description && <p className="text-gray-500 text-sm mb-6 max-w-md">{description}</p>}

      {/* Action Button */}
      {actionButtonText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          aria-label={actionButtonText}
        >
          {actionButtonText}
        </button>
      )}
    </div>
  );
}
