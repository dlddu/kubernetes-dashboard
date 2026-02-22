import { useState } from 'react';
import { submitWorkflow } from '../api/argo';
import type { WorkflowTemplateInfo } from '../api/argo';

export interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: WorkflowTemplateInfo;
  onNavigateToWorkflows: () => void;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

function buildInitialParams(template: WorkflowTemplateInfo): Record<string, string> {
  const params: Record<string, string> = {};
  for (const param of template.parameters) {
    params[param.name] = param.value ?? '';
  }
  return params;
}

export function SubmitModal({ isOpen, onClose, template, onNavigateToWorkflows }: SubmitModalProps) {
  const [paramValues, setParamValues] = useState<Record<string, string>>(() =>
    buildInitialParams(template)
  );
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const isSubmitting = submitState === 'submitting';

  const handleParamChange = (name: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setSubmitState('submitting');
    setErrorMessage('');
    try {
      await submitWorkflow(template.name, template.namespace, paramValues);
      setSubmitState('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(message);
      setSubmitState('error');
    }
  };

  const handleRetry = () => {
    handleSubmit();
  };

  const handleCancel = () => {
    onClose();
  };

  const dialogContent = (
    <div
      data-testid="submit-workflow-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-dialog-title"
      style={{ display: isOpen ? undefined : 'none' }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => !isSubmitting && handleCancel()}
          aria-hidden="true"
        />
      )}

      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 z-50">
        <h2 id="submit-dialog-title" className="text-xl font-bold text-gray-900">
          Submit Workflow: {template.name}
        </h2>

        {/* Parameters form */}
        {submitState === 'idle' || submitState === 'submitting' ? (
          <div className="space-y-3">
            {template.parameters.map((param) => (
              <div key={param.name} className="space-y-1">
                <label
                  htmlFor={`param-${param.name}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  {param.name}
                </label>
                {param.enum && param.enum.length > 0 ? (
                  <select
                    id={`param-${param.name}`}
                    data-testid={`param-select-${param.name}`}
                    value={paramValues[param.name] ?? ''}
                    onChange={(e) => handleParamChange(param.name, e.target.value)}
                    disabled={isSubmitting}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {param.enum.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`param-${param.name}`}
                    data-testid={`param-input-${param.name}`}
                    type="text"
                    value={paramValues[param.name] ?? ''}
                    onChange={(e) => handleParamChange(param.name, e.target.value)}
                    disabled={isSubmitting}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                )}
              </div>
            ))}

            {/* Spinner */}
            {isSubmitting && (
              <div data-testid="submit-spinner" className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                data-testid="cancel-button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded transition-colors ${
                  isSubmitting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                data-testid="confirm-button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className={`px-4 py-2 rounded transition-colors ${
                  isSubmitting
                    ? 'bg-blue-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Success view */}
        {submitState === 'success' && (
          <div data-testid="submit-success-view" className="space-y-4">
            <div className="flex items-center gap-2 text-green-700">
              <span className="text-lg font-semibold">Workflow submitted successfully!</span>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                data-testid="view-workflow-link"
                onClick={onNavigateToWorkflows}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                View Workflow
              </button>
            </div>
          </div>
        )}

        {/* Error view */}
        {submitState === 'error' && (
          <div data-testid="submit-error-view" className="space-y-4">
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="text-red-800 text-sm">{errorMessage}</div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                data-testid="cancel-button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                data-testid="retry-button"
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return dialogContent;
}
