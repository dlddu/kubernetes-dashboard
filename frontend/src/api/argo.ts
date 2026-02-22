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

export interface WorkflowStepInfo {
  name: string;
  phase: string;
}

export interface WorkflowInfo {
  name: string;
  namespace: string;
  phase: string;
  templateName: string;
  startedAt: string;
  finishedAt: string;
  nodes: WorkflowStepInfo[];
}

export async function fetchWorkflowTemplates(namespace?: string): Promise<WorkflowTemplateInfo[]> {
  const url = buildURL('/api/argo/workflow-templates', { ns: namespace });
  return fetchJSON<WorkflowTemplateInfo[]>(url);
}

export async function fetchWorkflows(namespace?: string): Promise<WorkflowInfo[]> {
  const url = buildURL('/api/argo/workflows', { ns: namespace });
  return fetchJSON<WorkflowInfo[]>(url);
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
