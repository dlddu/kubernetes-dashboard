import { ReactNode } from 'react';

export interface EmptyStateProps {
  message: string;
  variant?: 'default' | 'success';
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  testId?: string;
}

export function EmptyState({
  message,
  variant = 'default',
  icon,
  action,
  className = '',
  testId = 'empty-state',
}: EmptyStateProps) {
  // Determine variant styles
  const variantStyles =
    variant === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : 'bg-gray-50 border-gray-200 text-gray-600';

  return (
    <div
      data-testid={testId}
      role="status"
      className={`rounded-lg p-12 text-center border ${variantStyles} ${className}`}
    >
      {/* Icon */}
      {icon && <div className="mb-4">{icon}</div>}

      {/* Message */}
      <div className="text-lg">{message}</div>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
