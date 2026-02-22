import { useState, useEffect } from 'react';
import { fetchWorkflowDetail, WorkflowDetailInfo, WorkflowDetailStepInfo } from '../api/argo';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorRetry } from './ErrorRetry';
import { StepIO } from './StepIO';

export interface WorkflowDetailProps {
  namespace: string;
  name: string;
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

function getStepPhaseColorClass(phase: string): string {
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

function WorkflowDetailStep({ node }: { node: WorkflowDetailStepInfo }) {
  return (
    <div data-testid="workflow-detail-step" className="border border-gray-200 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span
          data-testid="workflow-detail-step-name"
          className="font-medium text-gray-900 text-sm"
        >
          {node.name}
        </span>
        <span
          data-testid="workflow-detail-step-phase"
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStepPhaseColorClass(node.phase)}`}
        >
          {node.phase}
        </span>
      </div>

      {node.message && (
        <p
          data-testid="workflow-detail-step-message"
          className="text-xs text-gray-600 italic"
        >
          {node.message}
        </p>
      )}

      <div
        data-testid="workflow-detail-step-time"
        className="text-xs text-gray-500 flex gap-4"
      >
        {node.startedAt && (
          <span>
            <span className="font-medium">Started: </span>
            {formatTime(node.startedAt)}
          </span>
        )}
        {node.finishedAt && (
          <span>
            <span className="font-medium">Finished: </span>
            {formatTime(node.finishedAt)}
          </span>
        )}
      </div>

      <StepIO
        stepName={node.name}
        inputs={node.inputs}
        outputs={node.outputs}
      />
    </div>
  );
}

export function WorkflowDetail({ namespace, name, onBack }: WorkflowDetailProps) {
  const [detail, setDetail] = useState<WorkflowDetailInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showParams, setShowParams] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchWorkflowDetail(namespace, name);
        if (!cancelled) {
          setDetail(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load workflow detail');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [namespace, name]);

  const handleToggleParams = () => {
    setShowParams((prev) => !prev);
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    fetchWorkflowDetail(namespace, name)
      .then((result) => {
        setDetail(result);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load workflow detail');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div data-testid="workflow-detail-page" className="space-y-4">
      {/* Back button — always visible */}
      <button
        data-testid="workflow-detail-back-button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        &larr; Back to Workflows
      </button>

      {/* Loading state */}
      {isLoading && (
        <LoadingSkeleton variant="card" count={3} />
      )}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorRetry
          error={error}
          onRetry={handleRetry}
          title="Error loading workflow detail"
        />
      )}

      {/* Detail content */}
      {!isLoading && !error && detail && (
        <>
          {/* Header card */}
          <div
            data-testid="workflow-detail-header"
            className="bg-white rounded-lg shadow p-6 space-y-3"
          >
            <div className="flex items-start justify-between">
              <h2
                data-testid="workflow-detail-name"
                className="text-xl font-bold text-gray-900 break-all"
              >
                {detail.name}
              </h2>
              <span
                data-testid="workflow-detail-phase"
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPhaseColorClass(detail.phase)}`}
              >
                {detail.phase}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Namespace: </span>
                <span data-testid="workflow-detail-namespace">{detail.namespace}</span>
              </div>
              <div>
                <span className="font-medium">Template: </span>
                <span data-testid="workflow-detail-template">{detail.templateName}</span>
              </div>
              <div data-testid="workflow-detail-started-at">
                <span className="font-medium">Started: </span>
                {formatTime(detail.startedAt)}
              </div>
              <div data-testid="workflow-detail-finished-at">
                <span className="font-medium">Finished: </span>
                {detail.finishedAt ? formatTime(detail.finishedAt) : '-'}
              </div>
            </div>

            {/* Parameters toggle */}
            <div>
              <button
                data-testid="workflow-detail-params-toggle"
                onClick={handleToggleParams}
                className="text-sm text-indigo-600 hover:text-indigo-800 underline focus:outline-none"
              >
                {showParams ? 'Hide Parameters' : 'Show Parameters'}
              </button>

              {showParams && (
                <div
                  data-testid="workflow-detail-params-list"
                  className="mt-2 bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-700 space-y-1"
                >
                  {detail.nodes.flatMap((node) =>
                    (node.inputs?.parameters ?? []).map((param, idx) => (
                      <div
                        key={`${node.name}-param-${idx}`}
                        data-testid="workflow-detail-param-item"
                        className="flex gap-2 text-xs"
                      >
                        <span className="font-medium text-gray-700">{param.name}</span>
                        <span className="text-gray-500">=</span>
                        <span className="text-gray-600">{param.value}</span>
                      </div>
                    ))
                  )}
                  {detail.nodes.every((node) => (node.inputs?.parameters ?? []).length === 0) && (
                    <p className="text-gray-500 text-xs">
                      No parameters found.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Steps timeline */}
          <div
            data-testid="workflow-detail-steps-timeline"
            className="space-y-3"
          >
            <h3 className="text-lg font-semibold text-gray-900">Steps</h3>
            {detail.nodes.map((node, idx) => (
              <WorkflowDetailStep key={`${node.name}-${idx}`} node={node} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
