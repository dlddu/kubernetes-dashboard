import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWorkflowDetail, deleteWorkflow, resubmitWorkflow, WorkflowDetailInfo, WorkflowDetailStepInfo, SubmitWorkflowResult } from '../api/argo';
import { usePolling } from '../hooks/usePolling';
import { useConfirmAction } from '../hooks/useConfirmAction';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorRetry } from './ErrorRetry';
import { StepIO } from './StepIO';
import { ConfirmDialog } from './ConfirmDialog';

export interface WorkflowDetailProps {
  namespace: string;
  name: string;
  onBack: () => void;
  onResubmitSuccess?: (workflowName: string) => void;
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

export function WorkflowDetail({ namespace, name, onBack, onResubmitSuccess }: WorkflowDetailProps) {
  const [detail, setDetail] = useState<WorkflowDetailInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showParams, setShowParams] = useState(false);
  const hasLoadedRef = useRef(false);
  const resubmitResultRef = useRef<SubmitWorkflowResult | null>(null);

  const deleteAction = useConfirmAction(
    useCallback(
      (target: { name: string; namespace: string }) => deleteWorkflow(target.name),
      [],
    ),
    onBack,
    'Failed to delete workflow',
  );

  const resubmitAction = useConfirmAction(
    useCallback(
      async (target: { name: string; namespace: string }) => {
        const result = await resubmitWorkflow(target.name);
        resubmitResultRef.current = result;
      },
      [],
    ),
    useCallback(() => {
      if (resubmitResultRef.current && onResubmitSuccess) {
        onResubmitSuccess(resubmitResultRef.current.name);
        resubmitResultRef.current = null;
      }
    }, [onResubmitSuccess]),
    'Failed to resubmit workflow',
  );

  const load = useCallback(async () => {
    if (!hasLoadedRef.current) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const result = await fetchWorkflowDetail(namespace, name);
      setDetail(result);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow detail');
    } finally {
      setIsLoading(false);
    }
  }, [namespace, name]);

  usePolling(load);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleParams = () => {
    setShowParams((prev) => !prev);
  };

  const handleRetry = () => {
    load();
  };

  return (
    <div data-testid="workflow-detail-page" className="space-y-4">
      {/* Navigation bar — always visible */}
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

      <ConfirmDialog
        isOpen={deleteAction.showDialog}
        title="Confirm Workflow Deletion"
        resourceName={deleteAction.target?.name ?? ''}
        resourceNamespace={deleteAction.target?.namespace ?? ''}
        description="Are you sure you want to delete the workflow:"
        warning="This action cannot be undone."
        confirmLabel="Delete"
        confirmingLabel="Deleting..."
        confirmColor="red"
        onConfirm={deleteAction.confirm}
        onCancel={deleteAction.cancel}
        isProcessing={deleteAction.isProcessing}
        error={deleteAction.error ?? undefined}
        testId="workflow-delete-confirm-dialog"
      />

      <ConfirmDialog
        isOpen={resubmitAction.showDialog}
        title="Confirm Workflow Resubmit"
        resourceName={resubmitAction.target?.name ?? ''}
        resourceNamespace={resubmitAction.target?.namespace ?? ''}
        description="A new workflow will be created with the same template and parameters as:"
        confirmLabel="Resubmit"
        confirmingLabel="Resubmitting..."
        confirmColor="blue"
        onConfirm={resubmitAction.confirm}
        onCancel={resubmitAction.cancel}
        isProcessing={resubmitAction.isProcessing}
        error={resubmitAction.error ?? undefined}
        testId="workflow-resubmit-confirm-dialog"
      />

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
              <div className="flex items-center gap-2">
                <span
                  data-testid="workflow-detail-phase"
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPhaseColorClass(detail.phase)}`}
                >
                  {detail.phase}
                </span>
                <button
                  data-testid="workflow-resubmit-button"
                  onClick={() => resubmitAction.requestAction({ name: detail.name, namespace: detail.namespace })}
                  className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                >
                  Resubmit
                </button>
                <button
                  data-testid="workflow-delete-button"
                  onClick={() => deleteAction.requestAction({ name: detail.name, namespace: detail.namespace })}
                  className="px-3 py-1 text-sm font-medium text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
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
                  {(detail.parameters ?? []).map((param, idx) => (
                    <div
                      key={`wf-param-${idx}`}
                      data-testid="workflow-detail-param-item"
                      className="flex gap-2 text-xs"
                    >
                      <span className="font-medium text-gray-700">{param.name}</span>
                      <span className="text-gray-500">=</span>
                      <span className="text-gray-600">{param.value}</span>
                    </div>
                  ))}
                  {(detail.parameters ?? []).length === 0 && (
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
