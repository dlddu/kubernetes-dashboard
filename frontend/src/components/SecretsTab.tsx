import { useState, useEffect } from 'react';
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
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(null);

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
    setOpenAccordionIndex(null);
    loadSecrets();
  }, [namespace]);

  const handleRetry = () => {
    loadSecrets();
  };

  const handleAccordionToggle = (index: number) => {
    setOpenAccordionIndex(openAccordionIndex === index ? null : index);
  };

  return (
    <div data-testid="secrets-tab" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Secrets</h1>

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
          message={`No secrets found${namespace ? ` in namespace "${namespace}"` : ''}`}
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
