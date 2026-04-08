import { fetchJSON, buildURL } from './client';

export interface KustomizationInfo {
  name: string;
  namespace: string;
  ready: boolean;
  suspended: boolean;
  sourceKind: string;
  sourceName: string;
  revision: string;
  interval: string;
  lastApplied: string;
  path: string;
}

export async function fetchKustomizations(namespace?: string): Promise<KustomizationInfo[]> {
  const url = buildURL('/api/fluxcd/kustomizations', { ns: namespace });
  return fetchJSON<KustomizationInfo[]>(url);
}

export interface KustomizationDetailInfo {
  name: string;
  namespace: string;
  suspended: boolean;
  spec: {
    interval: string;
    path: string;
    prune: boolean;
    sourceRef: {
      kind: string;
      name: string;
      namespace?: string;
    };
    dependsOn: Array<{ name: string; namespace?: string }>;
  };
  status: {
    lastAppliedRevision: string;
    conditions: Array<{
      type: string;
      status: string;
      reason: string;
      message: string;
      lastTransitionTime: string;
    }>;
  };
}

export async function fetchKustomizationDetail(
  namespace: string,
  name: string
): Promise<KustomizationDetailInfo> {
  return fetchJSON<KustomizationDetailInfo>(
    `/api/fluxcd/kustomizations/${namespace}/${name}`
  );
}

export async function reconcileKustomization(
  namespace: string,
  name: string
): Promise<void> {
  await fetchJSON(`/api/fluxcd/kustomizations/${namespace}/${name}/reconcile`, {
    method: 'POST',
  });
}

export async function suspendKustomization(
  namespace: string,
  name: string
): Promise<void> {
  await fetchJSON(`/api/fluxcd/kustomizations/${namespace}/${name}/suspend`, {
    method: 'POST',
  });
}

export async function resumeKustomization(
  namespace: string,
  name: string
): Promise<void> {
  await fetchJSON(`/api/fluxcd/kustomizations/${namespace}/${name}/resume`, {
    method: 'POST',
  });
}

// GitRepository types and API functions

export interface GitRepositoryInfo {
  name: string;
  namespace: string;
  url: string;
  ready: boolean;
  suspended: boolean;
  revision: string;
  interval: string;
  branch: string;
  tag: string;
}

export async function fetchGitRepositories(namespace?: string): Promise<GitRepositoryInfo[]> {
  const url = buildURL('/api/fluxcd/gitrepositories', { ns: namespace });
  return fetchJSON<GitRepositoryInfo[]>(url);
}

export interface GitRepositoryDetailInfo {
  name: string;
  namespace: string;
  suspended: boolean;
  spec: {
    url: string;
    interval: string;
    ref: {
      branch?: string;
      tag?: string;
      semver?: string;
      commit?: string;
    };
    secretRef?: {
      name: string;
    };
  };
  status: {
    conditions: Array<{
      type: string;
      status: string;
      reason: string;
      message: string;
      lastTransitionTime: string;
    }>;
    artifact?: {
      revision: string;
      lastUpdateTime: string;
    };
  };
}

export async function fetchGitRepositoryDetail(
  namespace: string,
  name: string
): Promise<GitRepositoryDetailInfo> {
  return fetchJSON<GitRepositoryDetailInfo>(
    `/api/fluxcd/gitrepositories/${namespace}/${name}`
  );
}

export async function reconcileGitRepository(
  namespace: string,
  name: string
): Promise<void> {
  await fetchJSON(`/api/fluxcd/gitrepositories/${namespace}/${name}/reconcile`, {
    method: 'POST',
  });
}

export async function fetchGitRepositoryBranches(
  namespace: string,
  name: string
): Promise<string[]> {
  const result = await fetchJSON<{ branches: string[] }>(
    `/api/fluxcd/gitrepositories/${namespace}/${name}/branches`
  );
  return result.branches;
}

export async function updateGitRepositoryBranch(
  namespace: string,
  name: string,
  branch: string
): Promise<void> {
  await fetchJSON(`/api/fluxcd/gitrepositories/${namespace}/${name}/update-branch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ branch }),
  });
}
