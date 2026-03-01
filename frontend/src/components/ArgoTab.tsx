import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { fetchWorkflowTemplates, WorkflowTemplateInfo } from '../api/argo';
import { WorkflowTemplateCard } from './WorkflowTemplateCard';
import { ArgoWorkflowsPage } from './ArgoWorkflowsPage';
import { ArgoWorkflowDetailPage } from './ArgoWorkflowDetailPage';
import { SubmitModal } from './SubmitModal';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { ErrorRetry } from './ErrorRetry';
import { useDataFetch } from '../hooks/useDataFetch';

interface ArgoTabProps {
  namespace?: string;
}

function ArgoTemplatesView({ namespace }: { namespace?: string }) {
  const navigate = useNavigate();
  const { data: templates, isLoading, error, refresh } = useDataFetch<WorkflowTemplateInfo>(
    () => fetchWorkflowTemplates(namespace),
    'Failed to fetch workflow templates',
    [namespace],
  );

  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplateInfo | null>(null);

  const handleTemplateCardClick = (template: WorkflowTemplateInfo) => {
    navigate(`/argo/templates/${encodeURIComponent(template.name)}`);
  };

  const handleNavigateToWorkflows = () => {
    if (selectedTemplate) {
      navigate(`/argo/templates/${encodeURIComponent(selectedTemplate.name)}`);
    }
    setSelectedTemplate(null);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
  };

  return (
    <>
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

      {selectedTemplate !== null && (
        <SubmitModal
          isOpen={true}
          onClose={handleCloseModal}
          template={selectedTemplate}
          onNavigateToWorkflows={handleNavigateToWorkflows}
        />
      )}
    </>
  );
}

export function ArgoTab({ namespace }: ArgoTabProps) {
  return (
    <div data-testid="argo-page" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Argo Workflows</h1>
      <Routes>
        <Route index element={<ArgoTemplatesView namespace={namespace} />} />
        <Route path="templates/:templateName" element={<ArgoWorkflowsPage namespace={namespace} />} />
        <Route path="templates/:templateName/workflows/:workflowName" element={<ArgoWorkflowDetailPage />} />
      </Routes>
    </div>
  );
}
