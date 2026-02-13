interface EmptyStateProps {
  message?: string;
  description?: string;
  icon?: 'folder' | 'search' | 'check';
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  variant?: 'success';
}

export function EmptyState({
  message = 'No data available',
  description,
  icon = 'folder',
  actionLabel,
  onAction,
  className = '',
  variant,
}: EmptyStateProps) {
  const getIconColor = () => {
    if (variant === 'success') return 'text-green-500';
    return 'text-gray-400';
  };

  const getIconComponent = () => {
    const iconClass = icon === 'check' || variant === 'success' ? 'check' : icon;

    if (iconClass === 'search') {
      return (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      );
    }

    if (iconClass === 'check') {
      return (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }

    return (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
    );
  };

  return (
    <div
      data-testid="empty-state"
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center text-center p-12 space-y-4 ${className}`}
    >
      <div
        data-testid="empty-state-icon"
        className={`${getIconColor()} ${icon === 'folder' ? 'folder' : icon === 'search' ? 'search' : 'check'}`}
        aria-label={`${icon} icon`}
        aria-hidden="true"
      >
        {getIconComponent()}
      </div>

      <div>
        <div className="text-lg font-medium text-gray-900 mb-2">{message}</div>
        {description && (
          <div data-testid="empty-state-description" className="text-sm text-gray-500">
            {description}
          </div>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
