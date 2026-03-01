import { useParams, useNavigate } from 'react-router-dom';
import { fetchWorkflows, WorkflowInfo } from '../api/argo';
import { WorkflowCard } from './WorkflowCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { ErrorRetry } from './ErrorRetry';
import { useDataFetch } from '../hooks/useDataFetch';

interface ArgoWorkflowsPageProps {
  namespace?: string;
}

export function ArgoWorkflowsPage({ namespace }: ArgoWorkflowsPageProps) {
  const { templateName } = useParams<{ templateName: string }>();
  const navigate = useNavigate();
  const decodedTemplateName = templateName ? decodeURIComponent(templateName) : '';

  const {
    data: workflows,
    isLoading,
    error,
    refresh,
  } = useDataFetch<WorkflowInfo>(
    () => fetchWorkflows(namespace, decodedTemplateName),
    'Failed to fetch workflow runs',
    [namespace, decodedTemplateName],
  );

  const handleWorkflowSelect = (workflow: WorkflowInfo) => {
    navigate(`/argo/templates/${templateName}/workflows/${encodeURIComponent(workflow.name)}`);
  };

  const handleBackToTemplates = () => {
    navigate('/argo');
  };

  return (
    <section data-testid="workflow-runs-page" className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          data-testid="back-to-templates"
          onClick={handleBackToTemplates}
          className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Back to Templates
        </button>
        <h2 className="text-xl font-bold text-gray-900">{decodedTemplateName} Runs</h2>
      </div>

      {isLoading && workflows.length === 0 && (
        <LoadingSkeleton
          variant="card"
          count={3}
        />
      )}

      {error && workflows.length === 0 && (
        <ErrorRetry
          error={error}
          onRetry={refresh}
          title="Error loading workflow runs"
        />
      )}

      {!isLoading && !error && workflows.length === 0 && (
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
  );
}
