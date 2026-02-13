interface LoadingSkeletonProps {
  variant?: 'card' | 'text' | 'circular';
  count?: number;
  width?: string;
  height?: string;
  className?: string;
  showHeader?: boolean;
  'aria-hidden'?: string;
}

export function LoadingSkeleton({
  variant = 'card',
  count = 1,
  width,
  height,
  className = '',
  showHeader,
  'aria-hidden': ariaHidden,
}: LoadingSkeletonProps) {
  const getVariantClasses = () => {
    if (variant === 'circular') {
      return 'rounded-full';
    }
    if (variant === 'text') {
      return 'h-4 rounded';
    }
    return 'rounded border border-gray-200';
  };

  const baseClasses = `animate-pulse bg-gray-200 ${getVariantClasses()}`;

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  if (variant === 'card' && showHeader !== undefined) {
    return (
      <div
        data-testid="loading-skeleton"
        role="status"
        aria-busy="true"
        aria-label="Loading"
        aria-live="polite"
        aria-hidden={ariaHidden}
        className={`w-full space-y-3 ${className}`}
        style={style}
      >
        {showHeader && (
          <div data-testid="skeleton-header" className="h-12 bg-gray-200 animate-pulse rounded" />
        )}
        <div data-testid="skeleton-body" className="h-32 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div
      data-testid="loading-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Loading"
      aria-live="polite"
      aria-hidden={ariaHidden}
      className={`w-full space-y-2 ${className}`}
      style={count > 1 ? {} : style}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          data-testid={`skeleton-line-${index}`}
          className={baseClasses}
          style={style}
        />
      ))}
    </div>
  );
}
