import { WorkflowTemplateInfo } from '../api/argo';

export interface WorkflowTemplateCardProps extends WorkflowTemplateInfo {
  onSubmit?: (template: WorkflowTemplateInfo) => void;
}

export function WorkflowTemplateCard({ name, namespace, parameters, onSubmit }: WorkflowTemplateCardProps) {
  const template: WorkflowTemplateInfo = { name, namespace, parameters };

  return (
    <div data-testid="workflow-template-card" className="bg-white rounded-lg shadow p-6 space-y-4">
      {/* Template Name */}
      <div className="flex items-center justify-between">
        <h3 data-testid="workflow-template-name" className="text-lg font-semibold text-gray-900 truncate">
          {name}
        </h3>
        <button
          data-testid="submit-button"
          onClick={() => onSubmit?.(template)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Submit
        </button>
      </div>

      {/* Namespace */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">Namespace: </span>
        <span data-testid="workflow-template-namespace">{namespace}</span>
      </div>

      {/* Parameters */}
      <div data-testid="workflow-template-params" className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Parameters</div>
        {parameters.length === 0 ? (
          <div className="text-sm text-gray-500">No parameters</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {parameters.map((param) => (
              <span
                key={param.name}
                data-testid="workflow-template-param-tag"
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {param.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
