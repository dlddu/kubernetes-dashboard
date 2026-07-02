import { describe, it, expect } from 'vitest';
import {
  buildNamespacePath,
  isNamespaceScopedPath,
  parseNamespaceFromPath,
  stripNamespaceFromPath,
} from './namespacePath';

describe('parseNamespaceFromPath', () => {
  it('should return null for paths without a namespace segment', () => {
    expect(parseNamespaceFromPath('/')).toBeNull();
    expect(parseNamespaceFromPath('/pods')).toBeNull();
    expect(parseNamespaceFromPath('/namespaces')).toBeNull();
  });

  it('should extract the namespace from prefixed paths', () => {
    expect(parseNamespaceFromPath('/namespaces/team-a')).toBe('team-a');
    expect(parseNamespaceFromPath('/namespaces/team-a/pods')).toBe('team-a');
    expect(parseNamespaceFromPath('/namespaces/team-a/argo/templates/x')).toBe('team-a');
  });

  it('should decode percent-encoded namespace segments', () => {
    expect(parseNamespaceFromPath('/namespaces/te%61m-a/pods')).toBe('team-a');
  });
});

describe('stripNamespaceFromPath', () => {
  it('should return unprefixed paths unchanged', () => {
    expect(stripNamespaceFromPath('/pods')).toBe('/pods');
    expect(stripNamespaceFromPath('/')).toBe('/');
  });

  it('should strip the namespace segment', () => {
    expect(stripNamespaceFromPath('/namespaces/team-a/pods')).toBe('/pods');
    expect(stripNamespaceFromPath('/namespaces/team-a')).toBe('/');
    expect(stripNamespaceFromPath('/namespaces/team-a/')).toBe('/');
  });
});

describe('isNamespaceScopedPath', () => {
  it('should treat tab paths as namespace-scoped', () => {
    expect(isNamespaceScopedPath('/')).toBe(true);
    expect(isNamespaceScopedPath('/pods')).toBe(true);
    expect(isNamespaceScopedPath('/flux')).toBe(true);
    expect(isNamespaceScopedPath('/namespaces/team-a/pods')).toBe(true);
  });

  it('should treat cluster-scoped paths as not selector-owned', () => {
    expect(isNamespaceScopedPath('/nodes')).toBe(false);
    expect(isNamespaceScopedPath('/debug')).toBe(false);
  });

  it('should treat resource-pinned FluxCD detail paths as not selector-owned', () => {
    // The /namespaces/<ns> segment on these identifies the resource itself
    expect(isNamespaceScopedPath('/namespaces/ns/fluxcd/kustomization/name')).toBe(false);
    expect(isNamespaceScopedPath('/namespaces/ns/fluxcd/gitrepository/name')).toBe(false);
    // Legacy form without the prefix
    expect(isNamespaceScopedPath('/fluxcd/kustomization/ns/name')).toBe(false);
  });
});

describe('buildNamespacePath', () => {
  it('should prefix namespaced paths with /namespaces/<ns>', () => {
    expect(buildNamespacePath('/pods', 'team-a')).toBe('/namespaces/team-a/pods');
    expect(buildNamespacePath('/flux', 'team-a')).toBe('/namespaces/team-a/flux');
  });

  it('should map the overview path to /namespaces/<ns> without a trailing slash', () => {
    expect(buildNamespacePath('/', 'team-a')).toBe('/namespaces/team-a');
  });

  it('should replace an existing namespace segment', () => {
    expect(buildNamespacePath('/namespaces/team-a/pods', 'team-b')).toBe(
      '/namespaces/team-b/pods'
    );
  });

  it('should strip the segment when "all" is selected', () => {
    expect(buildNamespacePath('/namespaces/team-a/pods', 'all')).toBe('/pods');
    expect(buildNamespacePath('/namespaces/team-a', 'all')).toBe('/');
    expect(buildNamespacePath('/pods', 'all')).toBe('/pods');
  });

  it('should leave cluster-scoped paths unprefixed', () => {
    expect(buildNamespacePath('/nodes', 'team-a')).toBe('/nodes');
    expect(buildNamespacePath('/debug', 'team-a')).toBe('/debug');
  });

  it('should leave resource-pinned FluxCD detail paths untouched', () => {
    // The resource's own namespace segment must survive selector changes
    expect(buildNamespacePath('/namespaces/ns/fluxcd/kustomization/name', 'team-a')).toBe(
      '/namespaces/ns/fluxcd/kustomization/name'
    );
    expect(buildNamespacePath('/namespaces/ns/fluxcd/kustomization/name', 'all')).toBe(
      '/namespaces/ns/fluxcd/kustomization/name'
    );
    expect(buildNamespacePath('/fluxcd/kustomization/ns/name', 'team-a')).toBe(
      '/fluxcd/kustomization/ns/name'
    );
  });
});
