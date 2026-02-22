import { useState } from 'react';
import { fetchWorkflowTemplates, fetchWorkflows, WorkflowTemplateInfo, WorkflowInfo } from '../api/argo';
import { WorkflowTemplateCard } from './WorkflowTemplateCard';
import { WorkflowCard } from './WorkflowCard';
import { WorkflowDetail } from './WorkflowDetail';
import { SubmitModal } from './SubmitModal';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { ErrorRetry } from './ErrorRetry';
import { useDataFetch } from '../hooks/useDataFetch';

interface ArgoTabProps {
  namespace?: string;
}

export function ArgoTab({ namespace }: ArgoTabProps) {
  const { data: templates, isLoading, error, refresh } = useDataFetch<WorkflowTemplateInfo>(
    () => fetchWorkflowTemplates(namespace),
    'Failed to fetch workflow templates',
    [namespace],
  );

  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplateInfo | null>(null);
  const [showWorkflowRuns, setShowWorkflowRuns] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInfo | null>(null);

  const {
    data: workflows,
    isLoading: workflowsLoading,
    error: workflowsError,
    refresh: workflowsRefresh,
  } = useDataFetch<WorkflowInfo>(
    () => showWorkflowRuns ? fetchWorkflows(namespace) : Promise.resolve([]),
    'Failed to fetch workflow runs',
    [namespace, showWorkflowRuns],
  );

  const handleNavigateToWorkflows = () => {
    setSelectedTemplate(null);
    setShowWorkflowRuns(true);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
  };

  const handleWorkflowsTabClick = () => {
    setShowWorkflowRuns(true);
    setSelectedWorkflow(null);
  };

  const handleSelectWorkflow = (workflow: WorkflowInfo) => {
    setSelectedWorkflow(workflow);
  };

  const handleBackFromDetail = () => {
    setSelectedWorkflow(null);
  };

  return (
    <div data-testid="argo-page" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Argo Workflows</h1>

      <div className="flex gap-2">
        <button
          data-testid="workflows-tab"
          onClick={handleWorkflowsTabClick}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Workflow Runs
        </button>
      </div>

      {!showWorkflowRuns && (
        <div data-testid="workflow-templates-page">
          {isLoading && templates.length === 0 && (
            <LoadingSkeleton
              variant="card"
              count={3}
            />
          )}

          {error && templates.length === 0 && (
            <ErrorRetry
              error={error}
              onRetry={refresh}
              title="Error loading workflow templates"
            />
          )}

          {!isLoading && !error && templates.length === 0 && (
            <EmptyState
              message="No workflow templates found"
            />
          )}

          {templates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <WorkflowTemplateCard
                  key={`${template.namespace}-${template.name}`}
                  {...template}
                  onSubmit={setSelectedTemplate}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showWorkflowRuns && !selectedWorkflow && (
        <section data-testid="workflow-runs-page" className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Workflow Runs</h2>

          {workflowsLoading && workflows.length === 0 && (
            <LoadingSkeleton
              variant="card"
              count={3}
            />
          )}

          {workflowsError && workflows.length === 0 && (
            <ErrorRetry
              error={workflowsError}
              onRetry={workflowsRefresh}
              title="Error loading workflow runs"
            />
          )}

          {!workflowsLoading && !workflowsError && workflows.length === 0 && (
            <EmptyState
              message="No workflows found"
            />
          )}

          {workflows.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => (
                <WorkflowCard
                  key={`${workflow.namespace}-${workflow.name}`}
                  {...workflow}
                  onSelect={handleSelectWorkflow}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {showWorkflowRuns && selectedWorkflow && (
        <WorkflowDetail
          workflowName={selectedWorkflow.name}
          namespace={selectedWorkflow.namespace || namespace}
          onBack={handleBackFromDetail}
        />
      )}

      {selectedTemplate !== null && (
        <SubmitModal
          isOpen={true}
          onClose={handleCloseModal}
          template={selectedTemplate}
          onNavigateToWorkflows={handleNavigateToWorkflows}
        />
      )}
    </div>
  );
}
