interface UsageBarProps {
  percentage: number;
  type: 'cpu' | 'memory';
}

export function UsageBar({ percentage, type }: UsageBarProps) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // Determine color based on usage level
  const getColorClass = () => {
    if (clampedPercentage < 60) {
      return 'bg-green-500';
    } else if (clampedPercentage <= 80) {
      return 'bg-yellow-500';
    } else {
      return 'bg-red-500';
    }
  };

  // Format percentage to 1 decimal place
  const formattedPercentage = clampedPercentage.toFixed(1);

  return (
    <div data-testid="usage-bar" data-type={type}>
      <div
        data-testid="usage-bar-container"
        className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${type} usage ${formattedPercentage}%`}
      >
        <div
          data-testid="usage-bar-fill"
          className={`h-full ${getColorClass()} transition-all duration-300 ease-in-out`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}
