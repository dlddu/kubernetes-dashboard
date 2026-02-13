interface LoadingSkeletonProps {
  variant?: 'card' | 'text' | 'list' | 'table';
  count?: number;
  className?: string;
  ariaLabel?: string;
}

export function LoadingSkeleton({
  variant = 'card',
  count = 1,
  className = '',
  ariaLabel = 'Loading content',
}: LoadingSkeletonProps) {
  const normalizedCount = Math.max(0, Math.floor(count));

  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return 'space-y-4';
      case 'text':
        return 'space-y-2';
      case 'list':
        return 'space-y-3';
      case 'table':
        return 'space-y-2';
      default:
        return 'space-y-4';
    }
  };

  const getItemClasses = () => {
    switch (variant) {
      case 'card':
        return 'h-32 bg-gray-200 rounded-lg border border-gray-300 p-4';
      case 'text':
        return 'h-4 bg-gray-200 rounded w-full';
      case 'list':
        return 'h-16 bg-gray-200 rounded w-full py-3';
      case 'table':
        return 'h-12 bg-gray-200 rounded w-full border border-gray-300';
      default:
        return 'h-32 bg-gray-200 rounded-lg border border-gray-300 p-4';
    }
  };

  return (
    <div
      data-testid="loading-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
      className={`animate-pulse ${getVariantClasses()} ${className}`}
    >
      {Array.from({ length: normalizedCount }).map((_, index) => (
        <div
          key={index}
          data-testid="skeleton-item"
          className={getItemClasses()}
        />
      ))}
    </div>
  );
}
