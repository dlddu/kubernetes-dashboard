import { OverviewData } from '../../api/overview';

interface SummaryCardsProps {
  data: OverviewData;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const getStatusClass = (type: string, value: number) => {
    if (type === 'unhealthyPods') {
      return value === 0
        ? 'border-green-200 bg-green-50 success healthy ok'
        : 'border-red-200 bg-red-50 warning alert error';
    }
    if (type === 'cpu' || type === 'memory') {
      if (value >= 80) {
        return 'border-red-200 bg-red-50 warning alert high';
      } else if (value >= 50) {
        return 'border-yellow-200 bg-yellow-50 warning alert';
      }
      return 'border-green-200 bg-green-50 success ok';
    }
    return 'border-gray-200 bg-white';
  };

  const cards = [
    {
      id: 'nodes',
      label: 'Nodes',
      value: `${data.nodes.ready}/${data.nodes.total}`,
      description: 'Ready / Total',
      ariaLabel: `${data.nodes.ready} ready nodes out of ${data.nodes.total} total nodes`,
      className: getStatusClass('nodes', 0)
    },
    {
      id: 'unhealthy-pods',
      label: 'Unhealthy Pods',
      value: data.unhealthyPods.toString(),
      description: data.unhealthyPods === 0 ? 'All pods healthy' : 'Need attention',
      ariaLabel: `${data.unhealthyPods} unhealthy pods`,
      className: getStatusClass('unhealthyPods', data.unhealthyPods)
    },
    {
      id: 'cpu',
      label: 'Average CPU',
      value: `${Math.round(data.averageCPUUsage * 10) / 10}%`,
      description: 'Cluster average',
      ariaLabel: `Average CPU usage: ${Math.round(data.averageCPUUsage * 10) / 10}%`,
      className: getStatusClass('cpu', data.averageCPUUsage)
    },
    {
      id: 'memory',
      label: 'Average Memory',
      value: `${Math.round(data.averageMemoryUsage * 10) / 10}%`,
      description: 'Cluster average',
      ariaLabel: `Average memory usage: ${Math.round(data.averageMemoryUsage * 10) / 10}%`,
      className: getStatusClass('memory', data.averageMemoryUsage)
    }
  ];

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
      data-testid="overview-summary-cards"
    >
      {cards.map((card) => (
        <div
          key={card.id}
          className={`p-4 rounded-lg border-2 ${card.className} transition-all`}
          data-testid={`summary-card-${card.id}`}
          aria-label={card.ariaLabel}
        >
          <div className="text-sm font-medium text-gray-600 mb-1">
            {card.label}
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {card.value}
          </div>
          <div className="text-xs text-gray-500">
            {card.description}
          </div>
        </div>
      ))}
    </div>
  );
}
