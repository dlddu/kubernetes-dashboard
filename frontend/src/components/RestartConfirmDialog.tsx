import { useEffect } from 'react';

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
  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isRestarting) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, isRestarting, onCancel]);

  if (!isOpen) {
    return (
      <div
        data-testid="restart-confirm-dialog"
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => !isRestarting && onCancel()}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        data-testid="restart-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
          {/* Title */}
          <h2 id="dialog-title" className="text-xl font-bold text-gray-900">
            Confirm Deployment Restart
          </h2>

          {/* Message */}
          <div className="text-gray-700">
            <p>Are you sure you want to restart the deployment:</p>
            <p className="font-semibold mt-2">
              {deploymentName} <span className="text-gray-500">({deploymentNamespace})</span>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              This will trigger a rolling restart of all pods in this deployment.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              data-testid="error-message"
              role="alert"
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              data-testid="cancel-button"
              onClick={onCancel}
              disabled={isRestarting}
              className={`px-4 py-2 rounded transition-colors ${
                isRestarting
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              data-testid="confirm-button"
              onClick={onConfirm}
              disabled={isRestarting}
              aria-busy={isRestarting}
              className={`px-4 py-2 rounded transition-colors ${
                isRestarting
                  ? 'bg-blue-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRestarting ? 'Restarting...' : 'Confirm Restart'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
