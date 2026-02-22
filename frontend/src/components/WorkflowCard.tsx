import { WorkflowInfo } from '../api/argo';

export interface WorkflowCardProps extends WorkflowInfo {
  onSelect?: (workflow: WorkflowInfo) => void;
}

function getPhaseColorClass(phase: string): string {
  switch (phase) {
    case 'Running':
      return 'bg-blue-100 text-blue-800';
    case 'Succeeded':
      return 'bg-green-100 text-green-800';
    case 'Failed':
      return 'bg-red-100 text-red-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStepPhaseIcon(phase: string): string {
  switch (phase) {
    case 'Succeeded':
      return '✓';
    case 'Running':
      return '●';
    case 'Failed':
      return '✗';
    case 'Pending':
      return '○';
    default:
      return '○';
  }
}

function formatTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleString();
  } catch {
    return isoString;
  }
}

export function WorkflowCard({
  name,
  namespace,
  phase,
  templateName,
  startedAt,
  finishedAt,
  nodes,
  onSelect,
}: WorkflowCardProps) {
  const workflow: WorkflowInfo = { name, namespace, phase, templateName, startedAt, finishedAt, nodes };
  const phaseColorClass = getPhaseColorClass(phase);

  const handleClick = () => {
    onSelect?.(workflow);
  };

  return (
    <div
      data-testid="workflow-run-card"
      className="bg-white rounded-lg shadow p-6 space-y-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      {/* Header: name and phase badge */}
      <div className="flex items-center justify-between">
        <h3
          data-testid="workflow-run-name"
          className="text-lg font-semibold text-gray-900 truncate"
        >
          {name}
        </h3>
        <span
          data-testid="workflow-run-phase"
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${phaseColorClass}`}
        >
          {phase}
        </span>
      </div>

      {/* Template name */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">Template: </span>
        <span data-testid="workflow-run-template">{templateName}</span>
      </div>

      {/* Time info */}
      <div data-testid="workflow-run-time" className="text-sm text-gray-500">
        <span className="font-medium">Started: </span>
        {formatTime(startedAt)}
        {finishedAt && (
          <>
            <span className="ml-2 font-medium">Finished: </span>
            {formatTime(finishedAt)}
          </>
        )}
      </div>

      {/* Steps preview */}
      <div data-testid="workflow-run-steps-preview" className="flex flex-wrap items-center gap-1">
        {nodes.map((node, index) => (
          <span key={`${node.name}-${index}`} className="flex items-center gap-1">
            <span data-testid="workflow-run-step" className="flex items-center gap-1">
              <span
                data-testid="workflow-run-step-icon"
                className="text-sm"
              >
                {getStepPhaseIcon(node.phase)}
              </span>
              <span
                data-testid="workflow-run-step-name"
                className="text-xs text-gray-700"
              >
                {node.name}
              </span>
            </span>
            {index < nodes.length - 1 && (
              <span data-testid="workflow-run-step-arrow" className="text-gray-400 text-xs">
                →
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
