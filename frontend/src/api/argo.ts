import { fetchJSON, buildURL } from './client';

export interface ParameterInfo {
  name: string;
  value?: string;
  description?: string;
  enum?: string[];
}

export interface WorkflowTemplateInfo {
  name: string;
  namespace: string;
  parameters: ParameterInfo[];
}

export interface SubmitWorkflowResult {
  name: string;
  namespace: string;
}

export async function fetchWorkflowTemplates(namespace?: string): Promise<WorkflowTemplateInfo[]> {
  const url = buildURL('/api/argo/workflow-templates', { ns: namespace });
  return fetchJSON<WorkflowTemplateInfo[]>(url);
}

export async function submitWorkflow(
  templateName: string,
  _namespace: string,
  parameters: Record<string, string>
): Promise<SubmitWorkflowResult> {
  const url = `/api/argo/workflow-templates/${templateName}/submit`;
  return fetchJSON<SubmitWorkflowResult>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ parameters }),
  });
}
