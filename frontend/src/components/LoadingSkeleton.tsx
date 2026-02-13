interface LoadingSkeletonProps {
  shape?: 'rectangular' | 'circular';
  count?: number;
  width?: string;
  height?: string;
}

export function LoadingSkeleton({
  shape = 'rectangular',
  count = 1,
  width,
  height,
}: LoadingSkeletonProps) {
  // Handle edge cases
  const safeCount = count === undefined || count < 0 ? 1 : count === 0 ? 0 : count;

  // Determine shape classes
  const shapeClass = shape === 'circular' ? 'rounded-full' : 'rounded';

  // Build style object for custom dimensions
  const style: React.CSSProperties = {};
  if (width) {
    style.width = width;
  }
  if (height) {
    style.height = height;
  }

  // Default dimensions based on shape
  const defaultClasses = shape === 'circular'
    ? 'w-12 h-12'
    : 'w-full h-4';

  // If count is 1 or default, render single skeleton
  if (safeCount === 1) {
    return (
      <div
        data-testid="loading-skeleton"
        role="status"
        aria-busy="true"
        aria-label="Loading"
        aria-live="polite"
        className={`animate-pulse bg-gray-200 ${shapeClass} ${!width && !height ? defaultClasses : ''}`}
        style={Object.keys(style).length > 0 ? style : undefined}
      />
    );
  }

  // Render multiple skeletons
  return (
    <div
      data-testid="loading-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Loading"
      aria-live="polite"
      className="flex flex-col space-y-3"
    >
      <div data-testid="loading-skeleton-container" className="flex flex-col space-y-3">
        {Array.from({ length: safeCount }).map((_, index) => (
          <div
            key={index}
            data-testid={`skeleton-item-${index}`}
            className={`animate-pulse bg-gray-200 ${shapeClass} ${!width && !height ? defaultClasses : ''}`}
            style={Object.keys(style).length > 0 ? style : undefined}
          />
        ))}
      </div>
    </div>
  );
}
