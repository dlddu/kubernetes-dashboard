export const ALL_NAMESPACES = 'all';

// Cluster-scoped routes never carry a namespace segment, mirroring the kube
// API server where e.g. nodes are not namespaced. /fluxcd covers the detail
// pages, which pin their own resource namespace in the path.
const CLUSTER_SCOPED_PREFIXES = ['/nodes', '/debug', '/fluxcd'];

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

export function isNamespaceScopedPath(pathname: string): boolean {
  const stripped = stripNamespaceFromPath(pathname);
  return !CLUSTER_SCOPED_PREFIXES.some(
    (prefix) => stripped === prefix || stripped.startsWith(`${prefix}/`)
  );
}

// Rewrites a pathname to point at the same view scoped to the given
// namespace: /namespaces/<ns>/pods for team-a, back to /pods for "all".
// Cluster-scoped paths are returned without a namespace segment.
export function buildNamespacePath(pathname: string, namespace: string): string {
  const stripped = stripNamespaceFromPath(pathname);
  if (namespace === ALL_NAMESPACES || !isNamespaceScopedPath(stripped)) {
    return stripped;
  }
  const suffix = stripped === '/' ? '' : stripped;
  return `/namespaces/${encodeURIComponent(namespace)}${suffix}`;
}
