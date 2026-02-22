import { useState } from 'react';
import { WorkflowDetailIOData } from '../api/argo';

export interface StepIOProps {
  stepName: string;
  inputs: WorkflowDetailIOData | null | undefined;
  outputs: WorkflowDetailIOData | null | undefined;
}

function hasIOData(io: WorkflowDetailIOData | null | undefined): boolean {
  if (!io) return false;
  return (io.parameters?.length ?? 0) > 0 || (io.artifacts?.length ?? 0) > 0;
}

export function StepIO({ stepName, inputs, outputs }: StepIOProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasInputs = hasIOData(inputs);
  const hasOutputs = hasIOData(outputs);
  const hasAnyIO = hasInputs || hasOutputs;

  if (!hasAnyIO) {
    return null;
  }

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const safeInputs = inputs ?? { parameters: [], artifacts: [] };
  const safeOutputs = outputs ?? { parameters: [], artifacts: [] };

  return (
    <div className="mt-2">
      <button
        data-testid="workflow-detail-step-io-toggle"
        aria-expanded={isOpen}
        aria-controls={`step-io-panels-${stepName}`}
        onClick={handleToggle}
        className="text-xs text-indigo-600 hover:text-indigo-800 underline focus:outline-none"
      >
        Inputs / Outputs
      </button>

      {isOpen && (
        <div id={`step-io-panels-${stepName}`} className="mt-2 grid grid-cols-2 gap-2">
          {/* Inputs panel */}
          <div
            data-testid="workflow-detail-step-inputs-panel"
            className="border border-purple-200 bg-purple-50 rounded p-2"
          >
            <div className="text-xs font-semibold text-purple-700 mb-1">
              Inputs
            </div>

            {safeInputs.parameters.map((param, idx) => (
              <div
                key={`input-param-${idx}`}
                data-testid="workflow-detail-io-param"
                className="flex justify-between text-xs text-gray-700 py-0.5"
              >
                <span className="font-medium">{param.name}</span>
                <span className="ml-2 text-gray-500">{param.value}</span>
              </div>
            ))}

            {safeInputs.artifacts.map((artifact, idx) => (
              <div
                key={`input-artifact-${idx}`}
                data-testid="workflow-detail-io-artifact"
                className="flex flex-col text-xs text-gray-700 py-0.5"
              >
                <span className="font-medium">{artifact.name}</span>
                {artifact.path && <span className="text-gray-500">{artifact.path}</span>}
                {artifact.from && <span className="text-gray-500">{artifact.from}</span>}
                {artifact.size && <span className="text-gray-500">{artifact.size}</span>}
              </div>
            ))}
          </div>

          {/* Outputs panel */}
          <div
            data-testid="workflow-detail-step-outputs-panel"
            className="border border-green-200 bg-green-50 rounded p-2"
          >
            <div className="text-xs font-semibold text-green-700 mb-1">
              Outputs
            </div>

            {safeOutputs.parameters.map((param, idx) => (
              <div
                key={`output-param-${idx}`}
                data-testid="workflow-detail-io-param"
                className="flex justify-between text-xs text-gray-700 py-0.5"
              >
                <span className="font-medium">{param.name}</span>
                <span className="ml-2 text-gray-500">{param.value}</span>
              </div>
            ))}

            {safeOutputs.artifacts.map((artifact, idx) => (
              <div
                key={`output-artifact-${idx}`}
                data-testid="workflow-detail-io-artifact"
                className="flex flex-col text-xs text-gray-700 py-0.5"
              >
                <span className="font-medium">{artifact.name}</span>
                {artifact.path && <span className="text-gray-500">{artifact.path}</span>}
                {artifact.from && <span className="text-gray-500">{artifact.from}</span>}
                {artifact.size && <span className="text-gray-500">{artifact.size}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
