interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'line';
  count?: number;
  className?: string;
  height?: string;
  width?: string;
}

export function LoadingSkeleton({
  variant = 'line',
  count = 3,
  className = '',
  height,
  width,
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200';

  if (variant === 'list') {
    return (
      <div
        data-testid="loading-skeleton"
        data-variant="list"
        role="status"
        aria-busy="true"
        aria-label="Loading content"
        className={`space-y-4 ${className}`}
      >
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            data-testid={`skeleton-list-item-${index}`}
            className={`${baseClasses} rounded-lg h-20`}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        data-testid="loading-skeleton"
        data-variant="card"
        role="status"
        aria-busy="true"
        aria-label="Loading content"
        className={`${baseClasses} rounded-lg min-h-32 p-4 ${className}`}
        style={{ height, width }}
      >
        <div className="skeleton-header h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
        <div className="skeleton-body h-6 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  // line variant
  return (
    <div
      data-testid="loading-skeleton"
      data-variant="line"
      role="status"
      aria-busy="true"
      aria-label="Loading content"
      className={`${baseClasses} rounded h-4 w-full ${className}`}
      style={{ height, width }}
    />
  );
}
