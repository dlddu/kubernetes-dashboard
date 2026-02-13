import { useState, useEffect } from 'react';
import { fetchSecrets, Secret } from '../api/secrets';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorRetry } from './ErrorRetry';
import { EmptyState } from './EmptyState';

interface SecretsTabProps {
  namespace?: string;
}

export function SecretsTab({ namespace }: SecretsTabProps = {}) {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSecrets, setExpandedSecrets] = useState<Set<string>>(new Set());
  const [revealedValues, setRevealedValues] = useState<Set<string>>(new Set());
  const [isRetrying, setIsRetrying] = useState(false);

  const loadSecrets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchSecrets(namespace);
      setSecrets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch secrets');
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    loadSecrets();
  }, [namespace]);

  const handleRetry = () => {
    setIsRetrying(true);
    loadSecrets();
  };

  const toggleExpand = (secretName: string) => {
    const newExpanded = new Set(expandedSecrets);
    if (newExpanded.has(secretName)) {
      newExpanded.delete(secretName);
    } else {
      newExpanded.add(secretName);
    }
    setExpandedSecrets(newExpanded);
  };

  const toggleReveal = (key: string) => {
    const newRevealed = new Set(revealedValues);
    if (newRevealed.has(key)) {
      newRevealed.delete(key);
    } else {
      newRevealed.add(key);
    }
    setRevealedValues(newRevealed);
  };

  const decodeBase64 = (value: string): string => {
    try {
      return atob(value);
    } catch {
      return `Error: Invalid Base64 - ${value}`;
    }
  };

  return (
    <div data-testid="secrets-page" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Secrets</h1>

      {isLoading && (
        <div data-testid="secrets-loading">
          <LoadingSkeleton count={3} height="100px" />
        </div>
      )}

      {error && (
        <div data-testid="secrets-error">
          <ErrorRetry
            message={error}
            onRetry={handleRetry}
            isRetrying={isRetrying}
          />
        </div>
      )}

      {!isLoading && !error && secrets.length === 0 && (
        <div data-testid="no-secrets-message">
          <EmptyState
            message="No secrets found"
            description="There are no secrets in this namespace"
            icon="folder"
          />
        </div>
      )}

      {!isLoading && !error && secrets.length > 0 && (
        <div className="space-y-4">
          {secrets.map((secret) => {
            const isExpanded = expandedSecrets.has(secret.name);
            const keyCount = Object.keys(secret.data).length;

            return (
              <div
                key={`${secret.namespace}-${secret.name}`}
                data-testid="secret-card"
                className="bg-white rounded-lg shadow border border-gray-200"
              >
                <button
                  data-testid="expand-secret-button"
                  onClick={() => toggleExpand(secret.name)}
                  aria-expanded={isExpanded}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900">{secret.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span>{secret.namespace}</span>
                      <span className="mx-2">•</span>
                      <span>{secret.type}</span>
                      <span className="mx-2">•</span>
                      <span>{keyCount} {keyCount === 1 ? 'key' : 'keys'}</span>
                    </div>
                  </div>
                  <div
                    data-testid="expand-icon"
                    className={`transition-transform ${
                      isExpanded ? 'transform rotate-180 chevron-up' : 'chevron-down'
                    }`}
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div
                    data-testid="secret-data"
                    className="px-6 py-4 border-t border-gray-200 bg-gray-50"
                  >
                    <div className="space-y-3">
                      {Object.entries(secret.data).map(([key, value]) => {
                        const revealKey = `${secret.name}-${key}`;
                        const isRevealed = revealedValues.has(revealKey);

                        return (
                          <div key={key} className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-700">{key}</span>
                              <button
                                data-testid="reveal-secret-button"
                                onClick={() => toggleReveal(revealKey)}
                                aria-label={isRevealed ? 'Hide secret value' : 'Reveal secret value'}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                {isRevealed ? 'Hide' : 'Reveal'}
                              </button>
                            </div>
                            <div
                              data-testid="secret-value"
                              className="font-mono text-sm bg-white border border-gray-200 rounded px-3 py-2 break-all"
                            >
                              {isRevealed ? decodeBase64(value) : '••••••••'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
