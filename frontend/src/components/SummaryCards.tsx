import { UsageBar } from './UsageBar';
import type { OverviewData } from '../api/overview';

interface SummaryCardsProps {
  data: OverviewData;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const cards = [
    {
      testId: 'summary-card-nodes',
      label: 'Nodes',
      value: `${data.nodes.ready}/${data.nodes.total}`,
      showBar: false,
    },
    {
      testId: 'summary-card-unhealthy-pods',
      label: 'Unhealthy Pods',
      value: `${data.unhealthyPods}`,
      showBar: false,
    },
    {
      testId: 'summary-card-avg-cpu',
      label: 'Avg CPU',
      value: `${data.avgCpu}%`,
      showBar: true,
      barValue: data.avgCpu,
    },
    {
      testId: 'summary-card-avg-memory',
      label: 'Avg Memory',
      value: `${data.avgMemory}%`,
      showBar: true,
      barValue: data.avgMemory,
    },
  ];

  return (
    <div
      data-testid="summary-cards-container"
      aria-live="polite"
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      {cards.map((card) => (
        <div
          key={card.testId}
          data-testid={card.testId}
          role="article"
          className="summary-card border border-gray-200 rounded-lg p-4 bg-white shadow hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-600 font-medium">{card.label}</div>
            <div
              data-testid="summary-card-value"
              className="text-2xl font-bold text-gray-900"
            >
              {card.value}
            </div>
            {card.showBar && card.barValue !== undefined && (
              <UsageBar value={card.barValue} label={card.label} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
