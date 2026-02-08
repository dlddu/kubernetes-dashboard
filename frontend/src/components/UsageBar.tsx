interface UsageBarProps {
  percentage: number;
  label?: string;
  className?: string;
  showText?: boolean;
}

export function UsageBar({ percentage, label, className = '', showText = false }: UsageBarProps) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // Determine color based on percentage
  const getBarColor = () => {
    if (clampedPercentage >= 80) {
      return 'bg-red-500';
    } else if (clampedPercentage >= 60) {
      return 'bg-yellow-500';
    } else {
      return 'bg-green-500';
    }
  };

  const barColor = getBarColor();

  return (
    <div data-testid="usage-bar" className={`w-full ${className}`}>
      {label && <div className="mb-1 text-sm font-medium text-gray-700">{label}</div>}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <div
            className="h-3 bg-gray-200 rounded overflow-hidden"
            role="progressbar"
            aria-valuenow={clampedPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label || `${clampedPercentage}% usage`}
            aria-live="polite"
            style={{ width: '100%' }}
          >
            <div
              data-testid="usage-bar-fill"
              className={`h-full ${barColor} transition-all duration-300 flex items-center justify-center text-xs text-white font-medium`}
              style={{ width: `${clampedPercentage}%` }}
            >
              {showText && `${Math.round(clampedPercentage)}%`}
            </div>
          </div>
        </div>
        <div className="text-sm font-medium text-gray-700 min-w-[3rem] text-right">
          {clampedPercentage % 1 === 0 ? `${clampedPercentage}%` : `${clampedPercentage.toFixed(1)}%`}
        </div>
      </div>
    </div>
  );
}
