import { ReactNode } from 'react';

interface SummaryCardProps {
  label: string;
  value: string;
  children?: ReactNode;
  testId?: string;
}

export function SummaryCard({ label, value, children, testId = 'summary-card' }: SummaryCardProps) {
  return (
    <article
      data-testid={testId}
      aria-label={label}
      className="bg-white rounded-lg shadow p-6 flex flex-col gap-3"
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
