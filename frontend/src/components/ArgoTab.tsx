import { useState } from 'react';
import { fetchWorkflowTemplates, WorkflowTemplateInfo } from '../api/argo';
import { WorkflowTemplateCard } from './WorkflowTemplateCard';
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

  const handleNavigateToWorkflows = () => {
    setSelectedTemplate(null);
    setShowWorkflowRuns(true);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
  };

  return (
    <div data-testid="argo-page" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Argo Workflows</h1>

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

      {showWorkflowRuns && (
        <section data-testid="workflow-runs-page" className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Workflow Runs</h2>
        </section>
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
