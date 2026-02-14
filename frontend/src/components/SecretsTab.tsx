import { useState, useEffect, useCallback } from 'react';
import { fetchSecrets, SecretInfo } from '../api/secrets';
import { SecretAccordion } from './SecretAccordion';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorRetry } from './ErrorRetry';
import { EmptyState } from './EmptyState';

interface SecretsTabProps {
  namespace?: string;
}

export function SecretsTab({ namespace }: SecretsTabProps = {}) {
  const [secrets, setSecrets] = useState<SecretInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNamespace, setSelectedNamespace] = useState(namespace || '');
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(null);

  const loadSecrets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchSecrets(selectedNamespace || undefined);
      setSecrets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch secrets');
    } finally {
      setIsLoading(false);
    }
  }, [selectedNamespace]);

  useEffect(() => {
    loadSecrets();
  }, [loadSecrets]);

  const handleRetry = () => {
    loadSecrets();
  };

  const handleNamespaceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedNamespace(event.target.value);
    setOpenAccordionIndex(null); // Close all accordions when changing namespace
  };

  const handleAccordionToggle = (index: number) => {
    setOpenAccordionIndex(openAccordionIndex === index ? null : index);
  };

  return (
    <div data-testid="secrets-tab" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Secrets</h1>

        <div>
          <label htmlFor="namespace-select" className="sr-only">
            Namespace
          </label>
          <select
            id="namespace-select"
            data-testid="namespace-selector"
            value={selectedNamespace}
            onChange={handleNamespaceChange}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Namespaces</option>
            <option value="default">default</option>
            <option value="kube-system">kube-system</option>
            <option value="kube-public">kube-public</option>
            <option value="kube-node-lease">kube-node-lease</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <LoadingSkeleton
          variant="list"
          count={5}
          testId="secrets-loading"
        />
      )}

      {error && (
        <ErrorRetry
          error={error}
          onRetry={handleRetry}
          title="Error loading secrets"
          testId="secrets-error"
        />
      )}

      {!isLoading && !error && secrets.length === 0 && (
        <EmptyState
          message={`No secrets found${selectedNamespace ? ` in namespace "${selectedNamespace}"` : ''}`}
          testId="no-secrets-message"
        />
      )}

      {!isLoading && !error && secrets.length > 0 && (
        <div className="space-y-3">
          {secrets.map((secret, index) => (
            <SecretAccordion
              key={`${secret.namespace}-${secret.name}`}
              secret={secret}
              isOpen={openAccordionIndex === index}
              onToggle={() => handleAccordionToggle(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
