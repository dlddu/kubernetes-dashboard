import { useEffect } from 'react';

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
  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) {
    return (
      <div
        data-testid="delete-confirm-dialog"
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
        onClick={() => !isDeleting && onCancel()}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        data-testid="delete-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
          {/* Title */}
          <h2 id="delete-dialog-title" className="text-xl font-bold text-gray-900">
            Confirm Secret Deletion
          </h2>

          {/* Message */}
          <div className="text-gray-700">
            <p>Are you sure you want to delete the secret:</p>
            <p className="font-semibold mt-2">
              {secretName} <span className="text-gray-500">({secretNamespace})</span>
            </p>
            <p className="text-sm text-red-600 mt-2">
              This action cannot be undone.
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
              disabled={isDeleting}
              className={`px-4 py-2 rounded transition-colors ${
                isDeleting
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              data-testid="confirm-button"
              onClick={onConfirm}
              disabled={isDeleting}
              aria-busy={isDeleting}
              className={`px-4 py-2 rounded transition-colors ${
                isDeleting
                  ? 'bg-red-400 text-white cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
