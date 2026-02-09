interface UsageBarProps {
  value: number;
  label?: string;
}

export function UsageBar({ value, label }: UsageBarProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);

  // Determine color based on value
  const getColorClass = () => {
    if (clampedValue < 60) {
      return 'bg-green-500';
    } else if (clampedValue <= 80) {
      return 'bg-yellow-500';
    } else {
      return 'bg-red-500';
    }
  };

  const ariaLabel = label || 'Usage progress';

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      data-testid="usage-bar"
      className="w-full h-2 bg-gray-200 rounded overflow-hidden"
    >
      <div
        data-testid="usage-bar-fill"
        className={`h-full transition-all duration-300 ${getColorClass()}`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
