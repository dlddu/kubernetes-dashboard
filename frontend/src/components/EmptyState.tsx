interface EmptyStateProps {
  message: string;
  icon?: 'inbox' | 'checkmark' | 'search' | 'folder';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
  ariaLabel?: string;
}

export function EmptyState({
  message,
  icon = 'inbox',
  title,
  description,
  actionText,
  onAction,
  className = '',
  ariaLabel,
}: EmptyStateProps) {
  const getIcon = () => {
    const iconClasses = icon === 'checkmark' ? 'w-16 h-16 text-green-500' : 'w-16 h-16 text-gray-400';

    switch (icon) {
      case 'inbox':
        return (
          <svg
            data-testid="empty-state-icon"
            className={iconClasses}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        );
      case 'checkmark':
        return (
          <svg
            data-testid="empty-state-icon"
            className={iconClasses}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'search':
        return (
          <svg
            data-testid="empty-state-icon"
            className={iconClasses}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        );
      case 'folder':
        return (
          <svg
            data-testid="empty-state-icon"
            className={iconClasses}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        );
      default:
        return (
          <svg
            data-testid="empty-state-icon"
            className={iconClasses}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        );
    }
  };

  const defaultAriaLabel = title || message;

  return (
    <div
      data-testid="empty-state"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel || defaultAriaLabel}
      className={`flex flex-col items-center justify-center p-8 space-y-4 ${className}`}
    >
      {getIcon()}

      {title && (
        <h2 className="text-xl font-semibold text-gray-900">
          {title}
        </h2>
      )}

      <p className="text-center text-gray-600 text-base leading-relaxed">
        {message}
      </p>

      {description && (
        <p className="text-center text-gray-500 text-sm">
          {description}
        </p>
      )}

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
