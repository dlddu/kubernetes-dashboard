interface EmptyStateProps {
  message: string;
  icon?: string;
  iconImage?: string;
  iconImageAlt?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  message,
  icon,
  iconImage,
  iconImageAlt = 'Empty state icon',
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  const showActionButton = actionText && onAction;

  return (
    <div
      data-testid="empty-state"
      role="status"
      className="flex flex-col items-center justify-center text-center p-8 gap-4 max-w-md mx-auto"
    >
      {/* Icon or Icon Image */}
      {(icon || iconImage) && (
        <div
          data-testid="empty-state-icon"
          aria-hidden="true"
          className="text-6xl text-gray-400"
        >
          {iconImage ? (
            <img
              src={iconImage}
              alt={iconImageAlt}
              className="w-16 h-16 mx-auto"
            />
          ) : (
            icon
          )}
        </div>
      )}

      {/* Message */}
      <div>
        <h3 className="text-lg font-medium text-gray-600">{message}</h3>

        {/* Description */}
        {description && (
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        )}
      </div>

      {/* Action Button */}
      {showActionButton && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
