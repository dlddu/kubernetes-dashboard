interface UsageBarProps {
  percentage: number;
  label?: string;
}

export function UsageBar({ percentage, label }: UsageBarProps) {
  // Determine color based on percentage
  const getColorClass = () => {
    if (percentage >= 80) {
      return 'bg-red-500'; // High usage - red/danger
    } else if (percentage >= 60) {
      return 'bg-yellow-500'; // Medium usage - yellow/warning
    } else {
      return 'bg-green-500'; // Low usage - green/success
    }
  };

  // Format aria-label
  const ariaLabel = label ? `${label}: ${percentage}%` : `${percentage}%`;

  return (
    <div
      data-testid="usage-bar"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className="w-full"
    >
      <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColorClass()} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
          {percentage.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
