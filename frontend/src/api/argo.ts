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

export interface WorkflowDetailParamInfo {
  name: string;
  value: string;
}

export interface WorkflowDetailArtifactInfo {
  name: string;
  path: string;
  from?: string;
  size?: string;
}

export interface WorkflowDetailIOData {
  parameters: WorkflowDetailParamInfo[];
  artifacts: WorkflowDetailArtifactInfo[];
}

export interface WorkflowDetailStepInfo {
  name: string;
  phase: string;
  startedAt: string;
  finishedAt: string;
  message: string;
  inputs?: WorkflowDetailIOData | null;
  outputs?: WorkflowDetailIOData | null;
}

export interface WorkflowDetailInfo {
  name: string;
  namespace: string;
  templateName: string;
  phase: string;
  startedAt: string;
  finishedAt: string;
  nodes: WorkflowDetailStepInfo[];
}

export async function fetchWorkflowDetail(
  namespace: string,
  name: string
): Promise<WorkflowDetailInfo> {
  const url = `/api/argo/workflows/${name}`;
  return fetchJSON<WorkflowDetailInfo>(url);
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
