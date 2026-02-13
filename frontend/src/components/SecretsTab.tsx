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
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

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
    }
  };

  useEffect(() => {
    loadSecrets();
  }, [namespace]);

  const handleRetry = () => {
    loadSecrets();
  };

  const toggleSecret = (secretName: string) => {
    setExpandedSecrets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(secretName)) {
        newSet.delete(secretName);
      } else {
        newSet.add(secretName);
      }
      return newSet;
    });
  };

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const decodeBase64 = (value: string): string => {
    try {
      return atob(value);
    } catch {
      return value; // Return original if decode fails
    }
  };

  return (
    <div data-testid="secrets-tab" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Secrets</h1>

      {isLoading && (
        <div data-testid="secrets-loading">
          <LoadingSkeleton variant="list" count={3} />
        </div>
      )}

      {error && (
        <div data-testid="secrets-error">
          <ErrorRetry message={error} onRetry={handleRetry} title="Error Loading Secrets" />
        </div>
      )}

      {!isLoading && !error && secrets.length === 0 && (
        <div data-testid="secrets-empty">
          <EmptyState
            message="No secrets found"
            description="There are no secrets in this namespace"
          />
        </div>
      )}

      {!isLoading && !error && secrets.length > 0 && (
        <div className="space-y-4">
          {secrets.map((secret) => {
            const isExpanded = expandedSecrets.has(secret.name);
            const secretId = `secret-${secret.namespace}-${secret.name}`;
            const contentId = `${secretId}-content`;

            return (
              <div key={`${secret.namespace}-${secret.name}`} data-testid={`secret-accordion-${secret.name}`} className="bg-white rounded-lg shadow">
                <button
                  data-testid="secret-accordion-header"
                  onClick={() => toggleSecret(secret.name)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={isExpanded}
                  aria-controls={contentId}
                  aria-label={`${secret.name} secret`}
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{secret.name}</h3>
                    <div className="flex gap-4 mt-1">
                      <span className="text-sm text-gray-600">Namespace: {secret.namespace}</span>
                      <span className="text-sm text-gray-600">Type: {secret.type}</span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isExpanded && (
                  <div id={contentId} className="px-6 pb-4 border-t border-gray-100">
                    {Object.keys(secret.data).length === 0 ? (
                      <p className="text-gray-500 text-sm py-4">No data in this secret</p>
                    ) : (
                      <div data-testid="secret-key-list" className="space-y-3 mt-4">
                        {Object.entries(secret.data).map(([key, value]) => {
                          const revealKey = `${secret.namespace}-${secret.name}-${key}`;
                          const isRevealed = revealedKeys.has(revealKey);
                          const decodedValue = decodeBase64(value);

                          return (
                            <div key={key} data-testid={`secret-key-value-${key}`} className="bg-gray-50 rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-sm font-semibold text-gray-700">
                                  {key}
                                </span>
                                <button
                                  data-testid={isRevealed ? 'hide-button' : 'reveal-button'}
                                  onClick={() => toggleReveal(revealKey)}
                                  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                  aria-label={isRevealed ? 'Hide value' : 'Reveal value'}
                                >
                                  {isRevealed ? 'Hide' : 'Show'}
                                </button>
                              </div>
                              <div data-testid={isRevealed ? 'secret-value-revealed' : 'secret-value-masked'} className="font-mono text-sm text-gray-600 break-all">
                                {isRevealed ? decodedValue : '••••••••'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
