interface UsageBarProps {
  percentage: number;
  label: string;
  className?: string;
  showLabel?: boolean;
  showPercentage?: boolean;
}

export function UsageBar({
  percentage,
  label,
  className = '',
  showLabel = true,
  showPercentage = true
}: UsageBarProps) {
  // Cap percentage at 100
  const displayPercentage = Math.min(percentage, 100);
  const roundedPercentage = Math.round(percentage * 10) / 10;

  // Determine color based on usage level
  const getColorClass = () => {
    if (percentage < 50) {
      return 'bg-green-500';
    } else if (percentage <= 80) {
      return 'bg-yellow-500';
    } else {
      return 'bg-red-500';
    }
  };

  return (
    <div
      className={className}
      data-testid="usage-bar"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label} usage: ${roundedPercentage}%`}
    >
      <div className="flex justify-between items-center mb-1">
        {showLabel && <span className="text-sm font-medium text-gray-700">{label}</span>}
        {showPercentage && <span className="text-sm text-gray-600">{roundedPercentage}%</span>}
      </div>
      <div
        className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
        data-testid="usage-bar-container"
      >
        <div
          className={`h-full ${getColorClass()} rounded-full transition-all duration-300`}
          style={{ width: `${displayPercentage}%` }}
          data-testid="usage-bar-fill"
        />
      </div>
    </div>
  );
}
