import { useState, useEffect, useCallback } from 'react';
import { fetchSecrets, deleteSecret, SecretInfo } from '../api/secrets';
import { SecretAccordion } from './SecretAccordion';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorRetry } from './ErrorRetry';
import { EmptyState } from './EmptyState';
import { usePolling } from '../hooks/usePolling';

interface SecretsTabProps {
  namespace?: string;
}

export function SecretsTab({ namespace }: SecretsTabProps = {}) {
  const [secrets, setSecrets] = useState<SecretInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(null);
  const [deletingSecret, setDeletingSecret] = useState<{
    name: string;
    namespace: string;
  } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadSecrets = useCallback(async () => {
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
  }, [namespace]);

  const { refresh } = usePolling(loadSecrets);

  // Re-fetch immediately when namespace changes and reset accordion
  useEffect(() => {
    setOpenAccordionIndex(null);
    loadSecrets();
  }, [namespace]);

  const handleAccordionToggle = (index: number) => {
    setOpenAccordionIndex(openAccordionIndex === index ? null : index);
  };

  const handleDeleteClick = (secret: { name: string; namespace: string }) => {
    setDeletingSecret(secret);
    setShowDeleteDialog(true);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSecret) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deleteSecret(deletingSecret.namespace, deletingSecret.name);
      setShowDeleteDialog(false);
      setDeletingSecret(null);
      setOpenAccordionIndex(null);
      await loadSecrets();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete secret');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (!isDeleting) {
      setShowDeleteDialog(false);
      setDeletingSecret(null);
      setDeleteError(null);
    }
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
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {deletingSecret && (
        <DeleteConfirmDialog
          isOpen={showDeleteDialog}
          secretName={deletingSecret.name}
          secretNamespace={deletingSecret.namespace}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isDeleting={isDeleting}
          error={deleteError || undefined}
        />
      )}
    </div>
  );
}
