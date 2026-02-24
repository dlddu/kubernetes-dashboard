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
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInfo | null>(null);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null);

  const {
    data: workflows,
    isLoading: workflowsLoading,
    error: workflowsError,
    refresh: workflowsRefresh,
  } = useDataFetch<WorkflowInfo>(
    () => selectedTemplateName !== null ? fetchWorkflows(namespace, selectedTemplateName) : Promise.resolve([]),
    'Failed to fetch workflow runs',
    [namespace, selectedTemplateName],
  );

  const handleTemplateCardClick = (template: WorkflowTemplateInfo) => {
    setSelectedTemplateName(template.name);
    setSelectedWorkflow(null);
  };

  const handleNavigateToWorkflows = () => {
    setSelectedTemplate(null);
    setSelectedTemplateName(null);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
  };

  const handleWorkflowSelect = (workflow: WorkflowInfo) => {
    setSelectedWorkflow(workflow);
  };

  const handleWorkflowDetailBack = () => {
    setSelectedWorkflow(null);
  };

  const handleBackToTemplates = () => {
    setSelectedTemplateName(null);
    setSelectedWorkflow(null);
  };

  return (
    <div data-testid="argo-page" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Argo Workflows</h1>

      {selectedTemplateName === null && (
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
                  onClick={handleTemplateCardClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTemplateName !== null && !selectedWorkflow && (
        <section data-testid="workflow-runs-page" className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              data-testid="back-to-templates"
              onClick={handleBackToTemplates}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Back to Templates
            </button>
            <h2 className="text-xl font-bold text-gray-900">{selectedTemplateName} Runs</h2>
          </div>

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
                  onSelect={handleWorkflowSelect}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {selectedTemplateName !== null && selectedWorkflow && (
        <WorkflowDetail
          namespace={selectedWorkflow.namespace}
          name={selectedWorkflow.name}
          onBack={handleWorkflowDetailBack}
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
