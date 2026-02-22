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

export async function fetchWorkflowTemplates(namespace?: string): Promise<WorkflowTemplateInfo[]> {
  const url = buildURL('/api/argo/workflow-templates', { ns: namespace });
  return fetchJSON<WorkflowTemplateInfo[]>(url);
}
