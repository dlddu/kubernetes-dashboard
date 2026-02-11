interface StatusBadgeProps {
  status: string;
  testId?: string;
}

export function StatusBadge({ status, testId = 'status-badge' }: StatusBadgeProps) {
  // Determine color variant based on status
  const getColorClasses = (): string => {
    const statusLower = status.toLowerCase();

    // Error statuses (red)
    if (
      statusLower === 'crashloopbackoff' ||
      statusLower === 'imagepullbackoff' ||
      statusLower === 'failed' ||
      statusLower === 'error'
    ) {
      return 'bg-red-100 text-red-800 border-red-200';
    }

    // Warning statuses (yellow)
    if (
      statusLower === 'pending' ||
      statusLower === 'unknown' ||
      statusLower === 'containercreating'
    ) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }

    // Success statuses (green)
    if (
      statusLower === 'running' ||
      statusLower === 'succeeded' ||
      statusLower === 'completed'
    ) {
      return 'bg-green-100 text-green-800 border-green-200';
    }

    // Default to gray for unknown statuses
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <span
      data-testid={testId}
      role="status"
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColorClasses()}`}
    >
      {status}
    </span>
  );
}
