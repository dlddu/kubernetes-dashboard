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
