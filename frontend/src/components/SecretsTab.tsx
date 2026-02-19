import { useState, useEffect, useCallback } from 'react';
import { fetchSecrets, deleteSecret, SecretInfo } from '../api/secrets';
import { SecretAccordion } from './SecretAccordion';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorRetry } from './ErrorRetry';
import { EmptyState } from './EmptyState';
import { useDataFetch } from '../hooks/useDataFetch';
import { useConfirmAction } from '../hooks/useConfirmAction';

interface SecretsTabProps {
  namespace?: string;
}

export function SecretsTab({ namespace }: SecretsTabProps = {}) {
  const { data: secrets, isLoading, error, refresh } = useDataFetch<SecretInfo>(
    () => fetchSecrets(namespace),
    'Failed to fetch secrets',
    [namespace],
  );

  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(null);

  const handleDeleteSuccess = useCallback(() => {
    setOpenAccordionIndex(null);
    refresh();
  }, [refresh]);

  const deleteAction = useConfirmAction(
    useCallback(
      (target: { name: string; namespace: string }) =>
        deleteSecret(target.namespace, target.name),
      [],
    ),
    handleDeleteSuccess,
    'Failed to delete secret',
  );

  // Reset accordion when namespace changes
  useEffect(() => {
    setOpenAccordionIndex(null);
  }, [namespace]);

  const handleAccordionToggle = (index: number) => {
    setOpenAccordionIndex(openAccordionIndex === index ? null : index);
  };

  return (
    <div data-testid="secrets-tab" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Secrets</h1>

      {isLoading && secrets.length === 0 && (
        <LoadingSkeleton
          variant="list"
          count={5}
          testId="secrets-loading"
        />
      )}

      {error && secrets.length === 0 && (
        <ErrorRetry
          error={error}
          onRetry={refresh}
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

      {secrets.length > 0 && (
        <div className="space-y-3">
          {secrets.map((secret, index) => (
            <SecretAccordion
              key={`${secret.namespace}-${secret.name}`}
              secret={secret}
              isOpen={openAccordionIndex === index}
              onToggle={() => handleAccordionToggle(index)}
              onDelete={deleteAction.requestAction}
            />
          ))}
        </div>
      )}

      {deleteAction.target && (
        <DeleteConfirmDialog
          isOpen={deleteAction.showDialog}
          secretName={deleteAction.target.name}
          secretNamespace={deleteAction.target.namespace}
          onConfirm={deleteAction.confirm}
          onCancel={deleteAction.cancel}
          isDeleting={deleteAction.isProcessing}
          error={deleteAction.error || undefined}
        />
      )}
    </div>
  );
}
