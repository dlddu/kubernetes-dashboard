export const ALL_NAMESPACES = 'all';

// Truly cluster-scoped views, mirroring the kube API server where e.g. nodes
// are not namespaced. These never carry a /namespaces/<ns> segment.
const CLUSTER_SCOPED_PREFIXES = ['/nodes', '/debug'];

// Views whose /namespaces/<ns> segment identifies the RESOURCE being shown
// (FluxCD detail pages), not the global namespace filter. The selector must
// neither rewrite nor be driven by the namespace on these paths.
const RESOURCE_PINNED_PREFIXES = ['/fluxcd'];

const NAMESPACE_PATH_PATTERN = /^\/namespaces\/([^/]+)(\/.*)?$/;

export function parseNamespaceFromPath(pathname: string): string | null {
  const match = NAMESPACE_PATH_PATTERN.exec(pathname);
  if (!match) {
    return null;
  }
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function stripNamespaceFromPath(pathname: string): string {
  const match = NAMESPACE_PATH_PATTERN.exec(pathname);
  if (!match) {
    return pathname;
  }
  return match[2] && match[2] !== '/' ? match[2] : '/';
}

// Whether the global namespace selector owns the /namespaces/<ns> segment of
// this path. False for cluster-scoped views (no segment at all) and for
// resource-pinned views (segment identifies the resource, not the filter).
export function isNamespaceScopedPath(pathname: string): boolean {
  const stripped = stripNamespaceFromPath(pathname);
  return ![...CLUSTER_SCOPED_PREFIXES, ...RESOURCE_PINNED_PREFIXES].some(
    (prefix) => stripped === prefix || stripped.startsWith(`${prefix}/`)
  );
}

// Rewrites a pathname to point at the same view scoped to the given
// namespace: /namespaces/<ns>/pods for team-a, back to /pods for "all".
// Paths the selector does not own are returned unchanged.
export function buildNamespacePath(pathname: string, namespace: string): string {
  if (!isNamespaceScopedPath(pathname)) {
    return pathname;
  }
  const stripped = stripNamespaceFromPath(pathname);
  if (namespace === ALL_NAMESPACES) {
    return stripped;
  }
  const suffix = stripped === '/' ? '' : stripped;
  return `/namespaces/${encodeURIComponent(namespace)}${suffix}`;
}
