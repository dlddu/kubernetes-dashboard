import { useState, useEffect, useCallback } from 'react';
import { WorkflowDetailInfo, WorkflowIODetailInfo } from '../api/argo';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorRetry } from './ErrorRetry';

export interface WorkflowDetailProps {
  workflowName: string;
  namespace?: string;
  onBack: () => void;
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

function formatTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleString();
  } catch {
    return isoString;
  }
}

const EMPTY_IO: WorkflowIODetailInfo = { parameters: [], artifacts: [] };

function safeIO(io: WorkflowIODetailInfo | undefined | null): WorkflowIODetailInfo {
  if (!io) return EMPTY_IO;
  return {
    parameters: io.parameters || [],
    artifacts: io.artifacts || [],
  };
}

function hasIO(inputs: WorkflowIODetailInfo, outputs: WorkflowIODetailInfo): boolean {
  return (
    inputs.parameters.length > 0 ||
    inputs.artifacts.length > 0 ||
    outputs.parameters.length > 0 ||
    outputs.artifacts.length > 0
  );
}

interface StepIOPanelProps {
  nodeIndex: number;
  inputs: WorkflowIODetailInfo;
  outputs: WorkflowIODetailInfo;
}

function StepIOPanel({ nodeIndex, inputs, outputs }: StepIOPanelProps) {
  const [open, setOpen] = useState(false);

  if (!hasIO(inputs, outputs)) {
    return null;
  }

  return (
    <div>
      <button
        data-testid="workflow-detail-step-io-toggle"
        onClick={() => setOpen(prev => !prev)}
        className="text-xs text-indigo-600 hover:text-indigo-800 mt-1"
        aria-expanded={open}
      >
        {open ? 'Hide' : 'Show'} Inputs / Outputs
      </button>

      <div
        data-testid="workflow-detail-step-inputs-panel"
        className="mt-2 rounded p-2 bg-purple-50 border border-purple-200"
        style={open ? undefined : { display: 'none' }}
      >
        <div className="text-xs font-semibold text-purple-700 mb-1">Inputs</div>
        {inputs.parameters.map((param, i) => (
          <div
            key={`input-param-${nodeIndex}-${i}`}
            data-testid="workflow-detail-io-param"
            className="text-xs text-gray-700"
          >
            {param.name}={param.value}
          </div>
        ))}
        {inputs.artifacts.map((artifact, i) => (
          <div
            key={`input-artifact-${nodeIndex}-${i}`}
            data-testid="workflow-detail-io-artifact"
            className="text-xs text-gray-700"
          >
            <span>{artifact.name}</span>
            {artifact.path && <span> {artifact.path}</span>}
            {artifact.from && <span> {artifact.from}</span>}
            {artifact.size && <span> {artifact.size}</span>}
          </div>
        ))}
      </div>

      <div
        data-testid="workflow-detail-step-outputs-panel"
        className="mt-2 rounded p-2 bg-green-50 border border-green-200"
        style={open ? undefined : { display: 'none' }}
      >
        <div className="text-xs font-semibold text-green-700 mb-1">Outputs</div>
        {outputs.parameters.map((param, i) => (
          <div
            key={`output-param-${nodeIndex}-${i}`}
            data-testid="workflow-detail-io-param"
            className="text-xs text-gray-700"
          >
            {param.name}={param.value}
          </div>
        ))}
        {outputs.artifacts.map((artifact, i) => (
          <div
            key={`output-artifact-${nodeIndex}-${i}`}
            data-testid="workflow-detail-io-artifact"
            className="text-xs text-gray-700"
          >
            <span>{artifact.name}</span>
            {artifact.path && <span> {artifact.path}</span>}
            {artifact.from && <span> {artifact.from}</span>}
            {artifact.size && <span> {artifact.size}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkflowDetail({ workflowName, namespace, onBack }: WorkflowDetailProps) {
  const [data, setData] = useState<WorkflowDetailInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paramsOpen, setParamsOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = namespace
        ? `/api/argo/workflows/${workflowName}?ns=${namespace}`
        : `/api/argo/workflows/${workflowName}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch workflow detail';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [workflowName, namespace]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <LoadingSkeleton variant="card" count={3} />;
  }

  if (error || !data) {
    return (
      <ErrorRetry
        error={error ?? 'Unknown error'}
        onRetry={fetchData}
        title="Error loading workflow detail"
      />
    );
  }

  const phaseColorClass = getPhaseColorClass(data.phase);
  const parameters = data.parameters || [];

  return (
    <div data-testid="workflow-detail-page" className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          data-testid="workflow-detail-back-button"
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Back to Workflows
        </button>
        <h2
          data-testid="workflow-detail-name"
          className="text-xl font-bold text-gray-900 truncate"
        >
          {data.name}
        </h2>
        <span
          data-testid="workflow-detail-phase"
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${phaseColorClass}`}
        >
          {data.phase}
        </span>
      </div>

      {/* Time info */}
      <div className="flex gap-6 text-sm text-gray-600">
        <div>
          <span className="font-medium">Started: </span>
          <span data-testid="workflow-detail-started-at">{formatTime(data.startedAt)}</span>
        </div>
        <div>
          <span className="font-medium">Finished: </span>
          <span data-testid="workflow-detail-finished-at">{formatTime(data.finishedAt)}</span>
        </div>
      </div>

      {/* Parameters section */}
      {parameters.length > 0 && (
        <div>
          <button
            data-testid="workflow-detail-params-toggle"
            onClick={() => setParamsOpen(prev => !prev)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            aria-expanded={paramsOpen}
          >
            {paramsOpen ? 'Hide' : 'Show'} Parameters ({parameters.length})
          </button>
          <div
            data-testid="workflow-detail-params-list"
            className="mt-2 space-y-1"
            style={paramsOpen ? undefined : { display: 'none' }}
          >
            {parameters.map((param, i) => (
              <div
                key={`param-${i}`}
                data-testid="workflow-detail-param-item"
                className="text-sm text-gray-700"
              >
                <span className="font-medium">{param.name}</span>: {param.value}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps timeline */}
      <div data-testid="workflow-detail-steps-timeline" className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Steps</h3>
        {(data.nodes || []).map((node, index) => {
          const stepPhaseClass = getPhaseColorClass(node.phase);
          const nodeInputs = safeIO(node.inputs);
          const nodeOutputs = safeIO(node.outputs);
          return (
            <div
              key={`step-${index}`}
              data-testid="workflow-detail-step"
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  data-testid="workflow-detail-step-name"
                  className="font-medium text-gray-900"
                >
                  {node.name}
                </span>
                <span
                  data-testid="workflow-detail-step-phase"
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stepPhaseClass}`}
                >
                  {node.phase}
                </span>
                <span
                  data-testid="workflow-detail-step-time"
                  className="text-xs text-gray-500"
                >
                  {formatTime(node.startedAt)}
                  {node.finishedAt && ` - ${formatTime(node.finishedAt)}`}
                </span>
              </div>

              {node.message && (
                <div
                  data-testid="workflow-detail-step-message"
                  className="mt-2 text-sm text-gray-600"
                >
                  {node.message}
                </div>
              )}

              <StepIOPanel
                nodeIndex={index}
                inputs={nodeInputs}
                outputs={nodeOutputs}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
