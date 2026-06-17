import { ReactNode, KeyboardEvent } from 'react';

interface SummaryCardProps {
  label: string;
  value: string;
  children?: ReactNode;
  testId?: string;
  /** When provided, the card becomes an interactive button (e.g. a status filter toggle). */
  onClick?: () => void;
  /** Highlights the card to indicate the filter it represents is currently active. */
  active?: boolean;
}

export function SummaryCard({
  label,
  value,
  children,
  testId = 'summary-card',
  onClick,
  active = false,
}: SummaryCardProps) {
  const interactive = typeof onClick === 'function';

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const interactiveClasses = interactive
    ? 'cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500'
    : '';
  const activeClasses = active ? 'ring-2 ring-blue-500' : '';

  return (
    <article
      data-testid={testId}
      aria-label={label}
      className={`bg-white rounded-lg shadow p-6 flex flex-col gap-3 ${interactiveClasses} ${activeClasses}`.trim()}
      onClick={onClick}
      onKeyDown={interactive ? handleKeyDown : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? active : undefined}
    >
      <div className="flex flex-col gap-2">
        <h3 data-testid="summary-card-label" className="text-sm font-medium text-gray-600">
          {label}
        </h3>
        <p data-testid="summary-card-value" className="text-2xl font-bold text-gray-900">
          {value}
        </p>
      </div>
      {children && <div className="mt-2">{children}</div>}
    </article>
  );
}
