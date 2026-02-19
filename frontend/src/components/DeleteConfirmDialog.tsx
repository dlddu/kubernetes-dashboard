import { ConfirmDialog } from './ConfirmDialog';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  secretName: string;
  secretNamespace: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  error?: string;
}

export function DeleteConfirmDialog({
  isOpen,
  secretName,
  secretNamespace,
  onConfirm,
  onCancel,
  isDeleting = false,
  error,
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Confirm Secret Deletion"
      resourceName={secretName}
      resourceNamespace={secretNamespace}
      description="Are you sure you want to delete the secret:"
      warning="This action cannot be undone."
      confirmLabel="Delete"
      confirmingLabel="Deleting..."
      confirmColor="red"
      onConfirm={onConfirm}
      onCancel={onCancel}
      isProcessing={isDeleting}
      error={error}
      testId="delete-confirm-dialog"
    />
  );
}
