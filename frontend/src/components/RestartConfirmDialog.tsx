import { ConfirmDialog } from './ConfirmDialog';

interface RestartConfirmDialogProps {
  isOpen: boolean;
  deploymentName: string;
  deploymentNamespace: string;
  onConfirm: () => void;
  onCancel: () => void;
  isRestarting?: boolean;
  error?: string;
}

export function RestartConfirmDialog({
  isOpen,
  deploymentName,
  deploymentNamespace,
  onConfirm,
  onCancel,
  isRestarting = false,
  error,
}: RestartConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Confirm Deployment Restart"
      resourceName={deploymentName}
      resourceNamespace={deploymentNamespace}
      description="Are you sure you want to restart the deployment:"
      warning="This will trigger a rolling restart of all pods in this deployment."
      confirmLabel="Confirm Restart"
      confirmingLabel="Restarting..."
      confirmColor="blue"
      onConfirm={onConfirm}
      onCancel={onCancel}
      isProcessing={isRestarting}
      error={error}
      testId="restart-confirm-dialog"
    />
  );
}
