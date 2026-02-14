export interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'table';
  count?: number;
  className?: string;
  testId?: string;
}

export function LoadingSkeleton({
  variant = 'card',
  count,
  className = '',
  testId = 'loading-skeleton',
}: LoadingSkeletonProps) {
  // Determine default count based on variant
  const defaultCount = variant === 'card' ? 3 : 5;
  const itemCount = count ?? defaultCount;

  // Generate skeleton items
  const skeletonItems = Array.from({ length: itemCount }, (_, index) => {
    if (variant === 'card') {
      return (
        <div
          key={index}
          data-testid={`skeleton-item-${index}`}
          className="bg-gray-200 rounded-lg h-32"
        />
      );
    }

    if (variant === 'list') {
      return (
        <div
          key={index}
          data-testid={`skeleton-item-${index}`}
          className="bg-gray-200 rounded h-4 mb-3"
        />
      );
    }

    if (variant === 'table') {
      return (
        <div
          key={index}
          data-testid={`skeleton-item-${index}`}
          className="bg-gray-200 rounded h-12 mb-2"
        />
      );
    }

    return null;
  });

  return (
    <div
      data-testid={testId}
      aria-busy="true"
      aria-label="Loading..."
      className={`animate-pulse ${className}`}
    >
      {skeletonItems}
    </div>
  );
}
